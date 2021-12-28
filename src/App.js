import React, { useContext, useState } from "react";
import { store } from "./MyContext";
import { makeStyles } from "@material-ui/core/styles";
import loadDir from "./utils/loadDir";
import makeDir from "./utils/makeDir";
import Card from "@material-ui/core/Card";
import TextField from "@material-ui/core/TextField";
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    maxWidth: 275,
    minHeight: 200,
    padding: 20,
    margin: 20,
    backgroundColor: "#dgdgdg",
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

const App = () => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [makingNewDir, setMakingNewDir] = useState(false);
  const [name, setName] = useState("");

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      makeDir(e.target.value);
      setName("");
    }
  };

  const classes = useStyles();

  const dirs = loadDir();

  return (
    <div>
      {dirs.map((x) => {
        return (
          <Link to={"/elements/"}>
            <Card
              className={classes.root}
              onClick={() => {
                dispatch({ action: "setProject", payload: { name: x } });
              }}
            >
              {x}
            </Card>
          </Link>
        );
      })}

      {makingNewDir && (
        <Card className={classes.root}>
          <TextField
            id="outlined-basic"
            variant="outlined"
            value={name}
            onKeyDown={keyPress}
            onChange={(e) => setName(e.target.value)}
          />
        </Card>
      )}

      {!makingNewDir && (
        <Card className={classes.root} onClick={() => setMakingNewDir(true)}>
          + New Project
        </Card>
      )}
    </div>
  );
};
export default App;
