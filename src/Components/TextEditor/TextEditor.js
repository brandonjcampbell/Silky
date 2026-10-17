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
