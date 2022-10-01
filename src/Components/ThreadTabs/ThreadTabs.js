import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { store } from "../../MyContext";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import FormDialog from "../FormDialog";
import DraggableList from "../DraggableList";
import { getDisplayName } from "../../utils";
import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css
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

const ThreadTabs = () => {
  const {uuid} = useParams();
  const actorUuid= uuid;

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
      message:
        "Are you sure you want to remove " +
        actor.type +
        " " +
        actor.name +
        "? You won't be able to undo this action.",

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
        <>
          <DraggableList
            list={actor.sequence}
            saveList={(e) => {
              let clone = _.cloneDeep(actor);
              clone.sequence = e;
              clone.totalSequenceLength = 0;
              clone.sequence.forEach((x, index) => {
                x.consecutive = 0;
                if (x.incomingEdgeWeight === "0" && clone.sequence[index - 1]) {
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
            showAvatar={true}
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

          <FormControl variant="filled">
            <Autocomplete
              showAvatar={false}
              clearOnBlur={true}
              selectOnFocus={true}
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
                minWidth: 200,
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
              renderInput={(params) => {
                if (params && params.inputProps) {
                  params.inputProps.value = null;
                }
                return <TextField {...params} label="Then..." value={null} />;
              }}
            />
            <br />
            <FormDialog type={"snippet"} specialOp={addToThread} />
          </FormControl>
        </>
      )}
    </div>
  );
};

export default ThreadTabs;
