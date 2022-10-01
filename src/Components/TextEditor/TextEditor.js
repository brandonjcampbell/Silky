import React, { useState, useEffect, useRef, useContext } from "react";
import { store } from "../../MyContext";
import { AiFillSave } from "react-icons/ai";
import "./TextEditor.css";
import { getDisplayName } from "../../utils";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const TextEditor = ({ data, save, actorUuid, showAvatar, showTitle=false }) => {
  const globalState = useContext(store);
  const prevAmount = usePrevious({ actorUuid, data });
  const [currentBlock, setCurrentBlock] = useState(null);
  const [editorState, setEditorState] = useState();
  const [dirty, setDirty] = useState(null);
  const [saving, setSaving] = useState(0);
  const [current, setCurrent] = useState(data + "");
  const initial = data;

  useEffect(() => {
    setEditorState(data);
  }, []);

  useEffect(() => {
  });

  useEffect(() => {
    if (!prevAmount || (prevAmount && prevAmount.actorUuid !== actorUuid)) {
      setCurrentBlock(null);
      setEditorState(data);
    }
  }, [actorUuid, data]);

  const onEditorStateChange = (e) => {
    setDirty(true);
    setCurrent(e.currentTarget.innerHTML);
  };

  const goForIt = () => {
    save(current, actorUuid);
    setDirty(null);
  };

  return (
    <div className={"contentBlock"}>
      {showTitle && <div className="editingBlockBanner">
        <strong>{getDisplayName(actorUuid, globalState)}</strong>
      </div>}
      {dirty && (
        <AiFillSave
          className="unsaved"
          onClick={() => {
            goForIt();
          }}
        />
      )}

      <div>
        <p
          className="page"
          contenteditable="true"
          onInput={onEditorStateChange}
          dangerouslySetInnerHTML={{ __html: initial }}
        ></p>
      </div>
    </div>
  );
};

export default TextEditor;
