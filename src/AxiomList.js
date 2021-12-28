import React, { useContext, useState } from "react";
import { store } from "./MyContext";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Workspace from "./Workspace";

const AxiomList = ({ type }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const content = globalState.state.actors;
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [target, setTarget] = useState("");

  const [active, setActive] = useState(null);

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      go(subject, target, name);
    }
  };

  const go = (subject, target, name) => {
    if (subject && target && name) {
      dispatch({
        action: "add",
        for: type,
        payload: { name: name, subject: subject, target: target },
        class: "axiom",
      });
      setName("");
      setSubject("");
      setTarget("");
    }
  };
  const handleRowClick = (row) => {
    setActive(row);
  };
  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          height: "100vh",
          width: "500px",
          color: "white",
          padding: "30px;",
        }}
      >
        <div>
          <div>{type}</div>

          <FormControl variant="outlined">
            <InputLabel id="demo-simple-select-outlined-label">
              Subject
            </InputLabel>
            <Select
              labelId="demo-simple-select-outlined-label"
              id="demo-simple-select-outlined"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
              }}
              label="Subject"
            >
              <MenuItem value="">
                <em>Select Subject</em>
              </MenuItem>
              {content.map((x) => {
                return (
                  <MenuItem value={x.uuid}>
                    {globalState.getDisplayName(globalState, x)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            style={{ color: "white" }}
            id="outlined-basic"
            variant="outlined"
            value={name}
            onKeyDown={keyPress}
            onChange={(e) => setName(e.target.value)}
          />

          <FormControl variant="outlined">
            <InputLabel id="demo-simple-select-outlined-label">
              Target
            </InputLabel>
            <Select
              labelId="demo-simple-select-outlined-label"
              id="demo-simple-select-outlined"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
              }}
              label="Target"
            >
              <MenuItem value="">
                <em>Selet Target</em>
              </MenuItem>
              {content.map((x) => {
                return (
                  <MenuItem value={x.uuid}>
                    {globalState.getDisplayName(globalState, x)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <button onClick={() => go(subject, target, name)}>go</button>
        </div>

        {content &&
          content.map((x) => {
            if (x.type === type)
              return (
                <div
                  style={{ margin: "10px" }}
                  onClick={() => {
                    handleRowClick(x);
                  }}
                >
                  <button
                    onClick={() =>
                      dispatch({
                        action: "remove",
                        for: type,
                        payload: x.uuid,
                        class: "axiom",
                      })
                    }
                  >
                    X
                  </button>
                  {globalState.getDisplayName(globalState, x)}
                </div>
              );
          })}
      </div>
      <div>{active && <Workspace actor={active}></Workspace>}</div>
    </div>
  );
};
export default AxiomList;
