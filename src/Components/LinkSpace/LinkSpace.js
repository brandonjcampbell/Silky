import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import "./LinkSpace.css";

import TextField from "@material-ui/core/TextField";

import Avatar from "@mui/material/Avatar";

import FormDialog from "../FormDialog";
import SimpleList from "../SimpleList";

import FormControl from "@material-ui/core/FormControl";
import { getDisplayName } from "../../utils";
import Autocomplete from "@mui/material/Autocomplete";

import DeleteIcon from "@material-ui/icons/Delete";
import { uploadPic } from "../../utils";
import { confirmAlert } from "react-confirm-alert"; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css



const homedir = window.require("os").homedir();

const LinkSpace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const remove = () => {
    confirmAlert({
      title: "Confirm to remove",
      message: "Are you sure you want to remove " +actor.type+" "+ actor.name + "? You won't be able to undo this action.",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            dispatch({
              action: "removeActor",
              payload: { uuid: actorUuid },
            });
          },
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };
  
  const saveTitle = () => {
    setEditTitle(false);
    let clone = _.cloneDeep(actor);
    clone.name = title;
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  };

  function addToX(uuid, x) {
    let clone = _.cloneDeep(actor);
    if (!clone[x]) {
      clone[x] = [];
    }
    clone[x].push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "link",
      payload: { actor: clone },
    });
  }

  function removeFromX(uuid, x) {
    let clone = _.cloneDeep(actor);
    if (!clone[x]) {
      clone[x] = [];
    }
    clone[x] = clone[x].filter((y) => y.uuid !== uuid);
    dispatch({
      action: "saveActor",
      for: "link",
      payload: { actor: clone },
    });
  }

  return (
    <div>

      {actor && (
        <div>

<h2 className="workspaceHeader">
          <Avatar
            className="avatar"
            alt=" "
            sx={{ width: 100, height: 100 }}
            onClick={() => {
              uploadPic(actorUuid, globalState, setFreshener);
            }}
            src={
              homedir +
              "\\.silky\\" +
              globalState.state.project +
              "\\" +
              actorUuid +
              ".png?" +
              freshener
            }
          />
          <span className="title">
            <span
              onClick={() => {
                setEditTitle(!editTitle);
                setTitle(actor.name);
              }}
            >
              {!editTitle && actor.name}
            </span>
            {editTitle && (
              <TextField
                autoFocus
                sx={{ bgcolor: "white" }}
                id="outlined-basic"
                value={title}
                onKeyDown={keyPress}
                onBlur={() => {
                  saveTitle();
                }}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}
          </span>
          <span className="delete">
            <DeleteIcon onClick={remove} />
          </span>
        </h2>


          <div className="subjectBox">
            <SimpleList
              type="link"
              xAction={(uuid) => {
                removeFromX(uuid, "subjects");
              }}
              list={actor.subjects}
            />
            <FormControl variant="filled">
              <Autocomplete
                disablePortal
                clearOnBlur
                selectOnFocus
                blurOnSelect
                id="combo-box-demo"
                getOptionLabel={(option) =>
                  option.name +
                  "@tags:" +
                  option.tags +
                  (option.facts
                    ? option.facts
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) =>
                    x.type === "fact" &&
                    ((actor.subjects &&
                      !actor.subjects.map((y) => y.uuid).includes(x.uuid)) ||
                      !actor.subjects)
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addToX(newValue.uuid, "subjects");
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      <Avatar
                        alt=" "
                        sx={{ bgcolor: option.color ? option.color : "grey" }}
                        src={
                          homedir +
                          "\\.silky\\" +
                          globalState.state.project +
                          "\\" +
                          option.uuid +
                          ".png"
                        }
                      />
                      {props.key.split("@tags:")[0]}
                    </span>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Add a Fact..." />
                )}
              />
            </FormControl>
          </div>

<div className="relationshipBox">BECAUSE</div>
          <div className="targetBox">
            <SimpleList
              type="link"
              xAction={(uuid) => {
                removeFromX(uuid, "targets");
              }}
              list={actor.targets}
            />
            <FormControl variant="filled">
              <Autocomplete
                disablePortal
                clearOnBlur
                selectOnFocus
                blurOnSelect
                id="combo-box-demo"
                getOptionLabel={(option) =>
                  option.name +
                  "@tags:" +
                  option.tags +
                  (option.facts
                    ? option.facts
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) =>
                    x.type === "fact" &&
                    ((actor.targets &&
                      !actor.targets.map((y) => y.uuid).includes(x.uuid)) ||
                      !actor.targets)
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addToX(newValue.uuid, "targets");
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      <Avatar
                        alt=" "
                        sx={{ bgcolor: option.color ? option.color : "grey" }}
                        src={
                          homedir +
                          "\\.silky\\" +
                          globalState.state.project +
                          "\\" +
                          option.uuid +
                          ".png"
                        }
                      />
                      {props.key.split("@tags:")[0]}
                    </span>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Add a Fact..." />
                )}
              />
            </FormControl>
            {/* <FormDialog type={"fact"} specialOp={addToX} /> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkSpace;
