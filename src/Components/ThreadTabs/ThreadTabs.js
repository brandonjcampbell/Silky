import React, { useContext, useState } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import FormDialog from "../FormDialog";
import DraggableList from "../DraggableList";
import { getDisplayName } from "../../utils";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import TabPanel from "../TabPanel";
import Thread from "../Thread";
import DeleteIcon from "@material-ui/icons/Delete";
import { CgDuplicate } from "react-icons/cg";
import { uploadPic } from "../../utils";
import { ColorPicker } from "material-ui-color";
import { confirmAlert } from "react-confirm-alert"; // Import
import {

  GiSewingString,
  GiLightBulb
} from "react-icons/gi";
import {HiPuzzle} from "react-icons/hi"
import {AiFillTag} from "react-icons/ai"

import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css

import "./ThreadTabs.css";
const homedir = window.require("os").homedir();

const useStyles = makeStyles({
  root: {
    background: "#333",
    color: "white",
    width: "200px",
    padding: "5px",
    margin: "5px",
  },
  subSection: {
    color: "white",
  },
  p: {
    color: "#777",
  },
  link: {
    "text-decoration": "none",
    color: "#777",
  },
});

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const ThreadTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const { dispatch } = globalState;
  const [toggle, setToggle] = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");

  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

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

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
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

  function updateColor(newColor) {
    let clone = _.cloneDeep(actor);
    clone.color = "#" + newColor.hex;
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  function addToThread(next) {
    let clone = _.cloneDeep(actor);
    if (!clone.sequence) {
      clone.sequence = [];
    }
    clone.sequence.push({ uuid: next });
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  function duplicate() {
    dispatch({
      action: "duplicate",
      payload: { uuid: actorUuid },
    });
  }

  return (
    <div className="rootThreadDiv">
      {actor && (
        <div>
          <h2 className="threadspaceHeader">
            <div className="colorPicker">
              <ColorPicker
                value={actor.color}
                hideTextfield
                onChange={(e) => {
                  updateColor(e);
                }}
              />
            </div>

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
              <CgDuplicate onClick={duplicate} />
            </span>
          </h2>

          <Box>
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => {
                setCurrentTab(newValue);
              }}
              aria-label="basic tabs example"
            >
              <Tab label="Sequence" {...a11yProps(0)} />
              <Tab label="Editor" {...a11yProps(1)} />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={1}>
            <Thread actorUuid={actorUuid} />
          </TabPanel>

          <TabPanel value={currentTab} index={0}>
            <DraggableList
              list={actor.sequence}
              saveList={(e) => {
                let clone = _.cloneDeep(actor);
                clone.sequence = e;
                clone.totalSequenceLength = 0;
                clone.sequence.forEach((x, index) => {
                  x.consecutive = 0;
                  if (
                    x.incomingEdgeWeight === "0" &&
                    clone.sequence[index - 1]
                  ) {
                    x.consecutive = clone.sequence[index - 1].consecutive + 1;
                  }
                  clone.totalSequenceLength += parseInt(
                    (x.incomingEdgeWeight ? x.incomingEdgeWeight : 0) + ""
                  );
                });
                dispatch({
                  action: "saveActor",
                  for: "thread",
                  payload: { actor: clone },
                });
              }}
              showAvatar={false}
              showCharacterCount={150}
              showEdgeWeights={true}
              action="remove"
              handleClick={(e) => {
                console.log("handled Click", e);
              }}
              getType={(x) => {
                return (
                  globalState.state.actors.find((y) => x.uuid === y.uuid).type +
                  "s"
                );
              }}
              onDrop={() => {}}
            ></DraggableList>
            <br />
            <FormControl variant="filled">
              <Autocomplete
                disablePortal
                showAvatar={false}
                clearOnBlur
                selectOnFocus
                id="combo-box-demo"
                getOptionLabel={(option) =>
                  option.name +
                  "@tags:" +
                  option.tags +
                  (option.elements
                    ? option.elements
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) =>
                    x.type === "snippet" &&
                    x.uuid !== actor.uuid &&
                    (!actor.sequence ||
                      !actor.sequence.map((y) => y.uuid).includes(x.uuid))
                )}
                sx={{
                  minWidth: 600,
                  width: "100%",
                  bgcolor: "white",
                  borderRadius: "4px",
                }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addToThread(newValue.uuid);
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <div className="autoCompleteRow">
                      {props.key.split("@tags:")[0]}
                    </div>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Then..." />
                )}
              />
              <br />
              <FormDialog type={"snippet"} specialOp={addToThread} />
            </FormControl>
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default ThreadTabs;
