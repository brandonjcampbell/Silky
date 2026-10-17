import React, { useRef, useState } from "react";
import { browser } from "../../storage";
import { importProjects } from "../../storage/projectIO";
import "./BrowserStorageBar.css";

/**
 * Shown only when Silky runs in a plain browser (no Electron). Projects are
 * saved in this browser's IndexedDB; this bar lets the user also mirror them
 * to a real folder (Chromium) or move them around as a JSON export.
 */
const BrowserStorageBar = () => {
  const [folder, setFolder] = useState(browser.connectedDirectoryName());
  const [note, setNote] = useState("");
  const fileInput = useRef();

  const connect = async () => {
    const ok = await browser.connectDirectory();
    if (ok) {
      setFolder(browser.connectedDirectoryName());
      setNote("Folder connected. Projects now save to disk as well.");
      // Projects list may have changed after importing from the folder.
      window.location.reload();
    }
  };

  const onImport = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const names = await importProjects(f, f.name.replace(/\.silky\.json$|\.json$/i, ""));
      setNote(`Imported ${names.join(", ")}.`);
      window.location.reload();
    } catch (err) {
      setNote("Import failed: " + err.message);
    }
    e.target.value = "";
  };

  return (
    <div className="storageBar">
      <span className="storageBar__status">
        {folder
          ? `Saving in this browser and to folder “${folder}”`
          : "Saving in this browser only (IndexedDB)"}
      </span>
      <span className="storageBar__actions">
        {browser.canPickDirectory() && (
          <button onClick={connect} title="Mirror projects to a real folder on disk">
            {folder ? "Change folder…" : "Connect a folder…"}
          </button>
        )}
        <button onClick={() => browser.exportAll()} title="Download every project in one JSON file (each project also has its own export on its card)">
          Export all
        </button>
        <button onClick={() => fileInput.current.click()} title="Load a project or whole-store export">
          Import…
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={onImport} hidden />
      </span>
      {note && <span className="storageBar__note">{note}</span>}
    </div>
  );
};

export default BrowserStorageBar;
