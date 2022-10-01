import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { store } from "../../MyContext";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import TabPanel from "../TabPanel";

import Linker from "../Linker";

import FormControl from "@material-ui/core/FormControl";
import { getDisplayName } from "../../utils";
import Autocomplete from "@mui/material/Autocomplete";
import "./ElementTabs.css";

import { GiLightBulb } from "react-icons/gi";
import { AiFillTag } from "react-icons/ai";

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
const ElementTabs = () => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

  const { uuid } = useParams();
  const actorUuid = uuid;

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  if (actor && !actor.facts) {
    actor.facts = [];
  }

  return (
    <div className="elementFacts"><h3 className="facts">Facts</h3>
      {actor && (
        <Linker
          actor={actor}
          side="subject"
          linkType="INVOLVES"
          guestType="fact"
        />
      )}
    </div>
  );
};

export default ElementTabs;
