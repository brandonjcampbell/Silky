import React, { useState, useEffect, useRef, useContext } from "react";
//import { store } from "../../MyContext";
import "./TextEditor.css";
import { getDisplayName } from "../../utils";
import _ from "lodash";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const TextEditor = ({
  data,
  save,
  actorUuid,
  showAvatar,
  showTitle = false,
}) => {
 // const globalState = useContext(store);
  const prevAmount = usePrevious({ actorUuid, data });
  const [currentBlock, setCurrentBlock] = useState(null);
  const [editorState, setEditorState] = useState();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(0);
  const [current, setCurrent] = useState(data + "");
  const [recommendation, setRecommendation] = useState();
  const initial = data;

  useEffect(() => {
    setEditorState(data);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!prevAmount || (prevAmount && prevAmount.file !== data)) {
      setEditorState(data);
    }
  }, [actorUuid, data]);

  const onEditorStateChange = (e) => {
    setDirty(true);
    setCurrent(e.currentTarget.innerHTML);
  };

  const goForIt = () => {
    save(current);
    setDirty(null);
  };

  const checkKey = (e) => {
    if (e.ctrlKey && e.key === "s") {
      goForIt();
    }
  };

  const ref = useRef(null);

  return (
    <div className={"contentBlock"}>

      {dirty && (
        <div
          className="unsaved"
          onClick={() => {
            goForIt();
          }}
        ></div>
      )}

      <div>
        <p
          className="page"
          id="page"
          ref={ref}
          contenteditable="true"
          onInput={onEditorStateChange}
          dangerouslySetInnerHTML={{ __html: initial }}
          onKeyDown={checkKey}
          onBlur={() => {
            if (ref.current.id !== document.activeElement.id) {
              console.log("you clicked on something else!");
              goForIt();
            }
          }}
        ></p>
      </div>
    </div>
  );
};

export default TextEditor;
