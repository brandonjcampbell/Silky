import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaUndo,
  FaRedo,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaHeading,
  FaParagraph,
  FaQuoteRight,
  FaListUl,
  FaListOl,
  FaMinus,
  FaRemoveFormat,
} from "react-icons/fa";
import "./TextEditor.css";

/**
 * The writing surface for snippets (and any actor with prose content).
 *
 * Contract is unchanged from the original: `data` is an HTML string, `save`
 * is called with an HTML string. Internally the content is loaded into the
 * contenteditable imperatively (never via dangerouslySetInnerHTML), so React
 * re-renders during autosave don't reset the caret.
 */

const SAVE_DELAY = 900;

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const countWords = (el) =>
  el ? (el.innerText || "").trim().split(/\s+/).filter(Boolean).length : 0;

const TOOLS = [
  { group: "history", items: [
    { cmd: "undo", icon: FaUndo, title: "Undo (Ctrl+Z)" },
    { cmd: "redo", icon: FaRedo, title: "Redo (Ctrl+Y)" },
  ]},
  { group: "inline", items: [
    { cmd: "bold", icon: FaBold, title: "Bold (Ctrl+B)", state: "bold" },
    { cmd: "italic", icon: FaItalic, title: "Italic (Ctrl+I)", state: "italic" },
    { cmd: "underline", icon: FaUnderline, title: "Underline (Ctrl+U)", state: "underline" },
    { cmd: "strikeThrough", icon: FaStrikethrough, title: "Strikethrough", state: "strikeThrough" },
  ]},
  { group: "block", items: [
    { cmd: "formatBlock", arg: "h2", icon: FaHeading, title: "Heading", block: "h2" },
    { cmd: "formatBlock", arg: "h3", icon: FaHeading, title: "Subheading", block: "h3", small: true },
    { cmd: "formatBlock", arg: "p", icon: FaParagraph, title: "Paragraph", block: "p" },
    { cmd: "formatBlock", arg: "blockquote", icon: FaQuoteRight, title: "Quote", block: "blockquote" },
  ]},
  { group: "list", items: [
    { cmd: "insertUnorderedList", icon: FaListUl, title: "Bulleted list", state: "insertUnorderedList" },
    { cmd: "insertOrderedList", icon: FaListOl, title: "Numbered list", state: "insertOrderedList" },
  ]},
  { group: "misc", items: [
    { cmd: "insertHorizontalRule", icon: FaMinus, title: "Scene break" },
    { cmd: "clear", icon: FaRemoveFormat, title: "Clear formatting" },
  ]},
];

// `scene`: the full writing surface for snippets. `notes`: a lighter box
// for everything else (an element's description, a thread's notes).
const NOTES_TOOLS = TOOLS.filter((g) => g.group !== "misc" && g.group !== "block");

const TextEditor = ({ data, save, actorUuid, variant = "notes", placeholder }) => {
  const isScene = variant === "scene";
  const tools = isScene ? TOOLS : NOTES_TOOLS;
  const hint = placeholder || (isScene ? "Write the scene." : "Notes.");
  const ref = useRef(null);
  const timer = useRef(null);
  const lastSaved = useRef("");
  const [status, setStatus] = useState("saved"); // saved | dirty
  const [words, setWords] = useState(0);
  const [fmt, setFmt] = useState({});

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

  const commit = useCallback(() => {
    clearTimeout(timer.current);
    if (!ref.current) return;
    tidy(ref.current);
    const html = ref.current.innerHTML;
    if (html !== lastSaved.current) {
      lastSaved.current = html;
      save(html);
    }
    setStatus("saved");
  }, [save]);

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
        if (ref.current.innerHTML !== lastSaved.current) save(ref.current.innerHTML);
      }
    }
  }, [save]);

  // Reflect the selection's formatting in the toolbar.
  const refreshFmt = useCallback(() => {
    if (!ref.current || !ref.current.contains(document.activeElement)) return;
    const next = {};
    try {
      ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].forEach(
        (c) => { next[c] = document.queryCommandState(c); }
      );
      next.block = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
    } catch (e) {
      /* ignore */
    }
    setFmt(next);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshFmt);
    return () => document.removeEventListener("selectionchange", refreshFmt);
  }, [refreshFmt]);

  const exec = (tool) => {
    if (!ref.current) return;
    ref.current.focus();
    if (tool.cmd === "clear") {
      document.execCommand("removeFormat", false, null);
      document.execCommand("formatBlock", false, "p");
    } else if (tool.arg) {
      document.execCommand(tool.cmd, false, tool.arg);
    } else {
      document.execCommand(tool.cmd, false);
    }
    scheduleSave();
    refreshFmt();
  };

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

  const isActive = (tool) =>
    (tool.state && fmt[tool.state]) || (tool.block && fmt.block === tool.block);

  return (
    <div className={"contentBlock contentBlock--" + variant}>
      <div className="editorToolbar" role="toolbar" aria-label="Formatting">
        {tools.map((g) => (
          <span className="editorToolbar__group" key={g.group}>
            {g.items.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.title}
                  type="button"
                  title={t.title}
                  aria-label={t.title}
                  aria-pressed={!!isActive(t)}
                  className={
                    "editorToolbar__btn" +
                    (isActive(t) ? " is-active" : "") +
                    (t.small ? " is-small" : "")
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec(t)}
                >
                  <Icon />
                </button>
              );
            })}
          </span>
        ))}
      </div>

      <div
        className="page"
        id="page"
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={hint}
        onInput={scheduleSave}
        onKeyDown={onKeyDown}
        onKeyUp={refreshFmt}
        onMouseUp={refreshFmt}
        onPaste={onPaste}
        onBlur={commit}
      />

      <div className="editorFooter">
        <span>{words} {words === 1 ? "word" : "words"}</span>
        <span className={"editorFooter__status is-" + status}>
          {status === "dirty" ? "Unsaved changes" : "Saved"}
        </span>
      </div>
    </div>
  );
};

export default TextEditor;
