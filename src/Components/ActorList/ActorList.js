import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import { styled, alpha } from "@mui/material/styles";
import TextField from "@material-ui/core/TextField";
import DraggableList from "../DraggableList";
import _ from "lodash";
import FormDialog from "../FormDialog";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { Redirect } from "react-router-dom";
import "./ActorList.css";
const ActorList = ({ match, type, showAvatar = true, tag = null }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const content = globalState.state.actors;
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(
    match && match.params && match.params.uuid
      ? { uuid: match.params.uuid }
      : null
  );
  const [count, setCount] = useState(1);

  const {
    params: { userId },
  } = match;

  const handleRowClick = (row) => {
    setActive(row);
  };

  const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }));

  const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
  }));

  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    "& .MuiInputBase-input": {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create("width"),
      width: "100%",
      [theme.breakpoints.up("md")]: {
        width: "20ch",
      },
    },
  }));

  return (
    <div className="ActorList">
      {globalState.state.project === "Silky" && <Redirect to="/" />}
      <div className="controls">
        {type && <FormDialog type={type} />}
        <div>
          <SearchIcon />
          <TextField
            className="listSearch"
            id="outlined-basic"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="content">
        <DraggableList
          showAvatar={showAvatar}
          list={content.filter(
            (x) =>
              ((type && x.type === type) || !type) &&
              (!search ||
                x.name.includes(search) ||
                (x.tags && globalState.state.actors.filter(y=>x.tags.find(z=>z.uuid===y.uuid)).find(y=>y.name.includes(search)))) &&
              ((tag && x.tags && Array.isArray(x.tags) && x.tags.map(z=>z.uuid).includes(tag)) || !tag)
          )}
          handleClick={handleRowClick}
          saveList={(e) => {
            if (search) {
              alert("Clear your search to re-order the list.");
            }
            dispatch({
              action: "saveActors",
              for: type,
              payload: {
                actors: search ? content.filter((x) => x.type === type) : e,
              },
            });
          }}
          getType={(x) => {
            return (
              globalState.state.actors.find((y) => y.uuid === active.uuid)
                .type + "s"
            );
          }}
          onDrop={() => {}}
          reorderList={(e) => {
            dispatch({
              action: "reorderActors",
              for: type,
              payload: {
                actors: search ? content.filter((x) => x.type === type) : e,
              },
            });
          }}
        ></DraggableList>
      </div>
    </div>
  );
};
export default ActorList;
