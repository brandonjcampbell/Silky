import React, { useState, useEffect, useCallback } from "react";
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

/**
 * A formatting toolbar that acts on whichever contenteditable currently has
 * the caret (within `scopeRef`, if given). After a command it dispatches an
 * `input` event on that editable so its owner's autosave runs. This is what
 * lets one toolbar serve a whole thread of scenes.
 */

export const SCENE_TOOLS = [
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

export const NOTES_TOOLS = SCENE_TOOLS.filter(
  (g) => g.group !== "misc" && g.group !== "block"
);

const STATES = ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"];

const EditorToolbar = ({ tools = SCENE_TOOLS, scopeRef, fallbackRef }) => {
  const [fmt, setFmt] = useState({});

  const activeEditable = useCallback(() => {
    const el = document.activeElement;
    if (!el || !el.isContentEditable) return null;
    if (scopeRef && scopeRef.current && !scopeRef.current.contains(el)) return null;
    return el;
  }, [scopeRef]);

  const refreshFmt = useCallback(() => {
    if (!activeEditable()) {
      setFmt((f) => (Object.keys(f).length ? {} : f));
      return;
    }
    const next = {};
    try {
      STATES.forEach((c) => { next[c] = document.queryCommandState(c); });
      next.block = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
    } catch (e) {
      /* ignore */
    }
    setFmt(next);
  }, [activeEditable]);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshFmt);
    return () => document.removeEventListener("selectionchange", refreshFmt);
  }, [refreshFmt]);

  const exec = (tool) => {
    let el = activeEditable();
    if (!el && fallbackRef && fallbackRef.current) {
      fallbackRef.current.focus();
      el = fallbackRef.current;
    }
    if (!el) return;
    if (tool.cmd === "clear") {
      document.execCommand("removeFormat", false, null);
      document.execCommand("formatBlock", false, "p");
    } else if (tool.arg) {
      document.execCommand(tool.cmd, false, tool.arg);
    } else {
      document.execCommand(tool.cmd, false);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    refreshFmt();
  };

  const isActive = (tool) =>
    (tool.state && fmt[tool.state]) || (tool.block && fmt.block === tool.block);

  return (
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
  );
};

export default EditorToolbar;
