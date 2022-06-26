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
const ActorList = ({
  match,
  type,
  actorUuid,
  showAvatar = true,
  tag = null,
}) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(
    match && match.params && match.params.uuid
      ? { uuid: match.params.uuid }
      : null
  );
  const [count, setCount] = useState(1);

  // useEffect(()=>{
  // console.log(globalState.state.actors)
  // },[globalState.state.actors])

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
        {search}
        <DraggableList
          showAvatar={showAvatar}
          actorUuid={actorUuid}
          list={globalState.state.actors.filter(
            (x) =>
              (!type || (type && x.type === type)) &&
              (!tag ||
                globalState.state.actors.find(
                  (y) =>
                    Array.isArray(y.subjects) &&
                    y.subjects.includes(tag) &&
                    Array.isArray(y.targets) &&
                    y.targets.includes(x.uuid)
                )) &&
              (!search ||
                _.toLower(x.name).includes(_.toLower(search)) ||
                globalState.state.actors.find(
                  (y) =>
                    y.type === "link" &&
                    y.name === "TAGS" &&
                    y.targets &&
                    Array.isArray(y.targets) &&
                    y.targets.includes(x.uuid) &&
                    Array.isArray(y.subjects) &&
                    globalState.state.actors.find(
                      (z) =>
                        y.subjects.includes(z.uuid) &&
                        _.toLower(z.name).includes(_.toLower(search))
                    )
                ))
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
                actors: search
                  ? globalState.state.actors.filter((x) => x.type === type)
                  : e,
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
                actors: search
                  ? globalState.state.actors.filter((x) => x.type === type)
                  : e,
              },
            });
          }}
        ></DraggableList>
      </div>
    </div>
  );
};
export default ActorList;
