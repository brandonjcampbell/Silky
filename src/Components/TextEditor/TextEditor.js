import React, { useState, useEffect, useRef, useCallback } from "react";
import EditorToolbar, { SCENE_TOOLS, NOTES_TOOLS } from "./EditorToolbar";
import "./TextEditor.css";

/**
 * The writing surface for snippets (and any actor with prose content).
 *
 * Contract: `data` is an HTML string, `save` is called with an HTML string.
 * Content is loaded into the contenteditable imperatively (never via
 * dangerouslySetInnerHTML), so React re-renders during autosave don't reset
 * the caret.
 *
 * variant   "scene" — the full editor for snippets; "notes" — a lighter box.
 * chrome    false hides this editor's own toolbar and footer, for when a
 *           parent provides a shared toolbar (the thread view).
 * onStatus  optional callback with "saved" | "dirty" and the word count.
 */

const SAVE_DELAY = 900;

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const countWords = (el) =>
  el ? (el.innerText || "").trim().split(/\s+/).filter(Boolean).length : 0;

// Tidy the artifacts the native editing commands leave behind, in place so
// the selection (which lives on text nodes) survives.
const tidy = (root) => {
  root.querySelectorAll("span[style]").forEach((el) => {
    if (/^\s*font-weight:\s*normal;?\s*$/i.test(el.getAttribute("style") || "")) {
      el.replaceWith(...el.childNodes);
    }
  });
  root.querySelectorAll("hr[id]").forEach((el) => el.removeAttribute("id"));
  // zero-width anchors left by keepTypingHuman
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const zw = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.includes("\u200b")) zw.push(walker.currentNode);
  zw.forEach((t) => { t.nodeValue = t.nodeValue.replace(/\u200b/g, ""); });
};

/* ── keep typed text out of AI-marked spans ────────────────────────────────
   Chrome extends an inline span when you type inside or at the end of it,
   which would mark your own words as Spinner's. Before the browser inserts
   text, split the span at the caret and put the text between the halves. */
const aiSpanOf = (node) => {
  let n = node && node.nodeType === 3 ? node.parentNode : node;
  while (n && n.nodeType === 1) {
    if (n.hasAttribute && n.hasAttribute("data-ai")) return n;
    if (n.classList && n.classList.contains("page")) return null;
    n = n.parentNode;
  }
  return null;
};
const isAi = (n) => !!(n && n.nodeType === 1 && n.hasAttribute("data-ai"));

/** Split `span` at (container, offset); returns the node after which plain text should go. */
const splitAiSpan = (span, container, offset) => {
  const r = document.createRange();
  r.setStart(container, offset);
  r.setEndAfter(span);
  const tail = r.extractContents(); // partially-contained span is cloned with its attributes
  span.after(tail);
  if (!span.textContent) { const prev = span.previousSibling; span.remove(); return prev; }
  const next = span.nextSibling;
  if (isAi(next) && !next.textContent) next.remove();
  return span;
};

/** Where would the browser put the text? If inside/at the edge of an AI span, do it ourselves. */
const keepTypingHuman = (e, root) => {
  if (!["insertText", "insertParagraph", "insertLineBreak"].includes(e.inputType)) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  let range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return;
  let span = aiSpanOf(range.startContainer);
  let anchor = null; // node after which to insert
  let parent = null;
  if (span) {
    if (!range.collapsed) { range.deleteContents(); range = sel.getRangeAt(0); }
    parent = span.parentNode;
    anchor = splitAiSpan(span, range.startContainer, range.startOffset);
  } else if (range.collapsed && range.startContainer.nodeType === 1) {
    // caret sits between siblings; the browser would extend a neighbouring span
    const c = range.startContainer;
    const before = c.childNodes[range.startOffset - 1];
    const after = c.childNodes[range.startOffset];
    if (!isAi(before) && !isAi(after)) return;
    anchor = before || null;
    parent = c;
  } else if (range.collapsed && range.startContainer.nodeType === 3) {
    // at the very end of a text node directly before an AI span, or start after one
    const t = range.startContainer;
    const atEnd = range.startOffset === t.length && isAi(t.nextSibling);
    const atStart = range.startOffset === 0 && isAi(t.previousSibling);
    if (!atEnd && !atStart) return;
    anchor = atEnd ? t : t.previousSibling;
    parent = t.parentNode;
  } else return;

  e.preventDefault();
  // caret goes INSIDE the new text node, at its end, so the next keystroke
  // lands in it rather than drifting back into the span
  const placeIn = (textNode) => {
    const r = document.createRange();
    r.setStart(textNode, textNode.length);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  };
  if (e.inputType === "insertText") {
    // a trailing plain space would collapse at a block end; Chrome itself uses nbsp here
    const data = e.data === " " ? "\u00a0" : e.data || "";
    const text = document.createTextNode(data);
    if (anchor) anchor.after(text); else parent.prepend(text);
    placeIn(text);
  } else {
    // a paragraph or line break: a zero-width anchor keeps the caret outside the
    // span through the native command; tidy() strips it at save time
    const marker = document.createTextNode("\u200b");
    if (anchor) anchor.after(marker); else parent.prepend(marker);
    placeIn(marker);
    document.execCommand(e.inputType === "insertParagraph" ? "insertParagraph" : "insertLineBreak");
  }
  root.dispatchEvent(new Event("input", { bubbles: true }));
};

const TextEditor = ({
  data,
  save,
  actorUuid,
  variant = "notes",
  placeholder,
  chrome = true,
  onStatus,
}) => {
  const isScene = variant === "scene";
  const tools = isScene ? SCENE_TOOLS : NOTES_TOOLS;
  const hint = placeholder || (isScene ? "Write the scene." : "Notes.");

  const ref = useRef(null);
  const timer = useRef(null);
  const lastSaved = useRef("");
  // `save` is usually a fresh closure every render; keep the latest in a ref
  // so commit/flush never re-bind (and never flush early on a re-render).
  const saveRef = useRef(save);
  saveRef.current = save;
  const [status, setStatus] = useState("saved"); // saved | dirty
  const [words, setWords] = useState(0);

  useEffect(() => {
    if (onStatus) onStatus({ status, words });
  }, [status, words, onStatus]);

  // Load content when the actor (or its stored content) changes. The equality
  // guard means an autosave round-trip never rewrites the DOM under the caret.
  useEffect(() => {
    const html = typeof data === "string" ? data : "";
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
    lastSaved.current = html;
    setStatus("saved");
    setWords(countWords(ref.current));
  }, [actorUuid, data]);

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch (e) {
      /* older engines */
    }
  }, []);

  const commit = useCallback(() => {
    clearTimeout(timer.current);
    if (!ref.current) return;
    tidy(ref.current);
    const html = ref.current.innerHTML;
    if (html !== lastSaved.current) {
      lastSaved.current = html;
      saveRef.current(html);
    }
    setStatus("saved");
  }, []);

  const scheduleSave = useCallback(() => {
    setStatus("dirty");
    setWords(countWords(ref.current));
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, SAVE_DELAY);
  }, [commit]);

  // Native beforeinput (React's synthetic one lacks inputType in this version).
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const h = (e) => keepTypingHuman(e, el);
    el.addEventListener("beforeinput", h);
    return () => el.removeEventListener("beforeinput", h);
  }, []);

  // Flush a pending save when leaving the editor.
  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      if (ref.current) {
        tidy(ref.current);
        if (ref.current.innerHTML !== lastSaved.current) saveRef.current(ref.current.innerHTML);
      }
    }
  }, []);

  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      commit();
    }
  };

  // Paste as clean paragraphs: plain text in, <p> per blank-line-separated block.
  const onPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const html = text
      .replace(/\r\n?/g, "\n")
      .split(/\n{2,}/)
      .map((p) => "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>")
      .join("");
    document.execCommand("insertHTML", false, html);
    scheduleSave();
  };

  return (
    <div className={"contentBlock contentBlock--" + variant + (chrome ? "" : " contentBlock--bare")}>
      {chrome && <EditorToolbar tools={tools} scopeRef={ref} fallbackRef={ref} />}

      <div
        className="page"
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={hint}
        onInput={scheduleSave}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={commit}
      />

      {chrome && (
        <div className="editorFooter">
          <span>{words} {words === 1 ? "word" : "words"}</span>
          <span className={"editorFooter__status is-" + status}>
            {status === "dirty" ? "Unsaved changes" : "Saved"}
          </span>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
