import React, { createContext, useReducer } from "react";
import _ from "lodash";
import { projectDir } from "./storage";

let initialState = {
  project: "",
  cursor: null,
  actors: [],
  content: [],
};

const store = createContext(initialState);
const { Provider } = store;

const setProject = (state, action) => {
  let newState = _.cloneDeep(initialState);

  if (action.payload.name === "") {
    newState.project = "";
    newState.dir = ``;
  } else {
    newState.project = action.payload.name;
    newState.dir = projectDir(action.payload.name);

    if (action.payload.callback) {
      action.payload.callback();
    }
  }

  return newState;
};

const find = (state, id) => {
  let result = state.state.actors.find((x) => x.uuid === id);
  return result;
};

const setActiveElement = (state, action) => {
  let newState = _.cloneDeep(state);
  newState.activeElement = action.payload.file;
  if (action.payload.callback) {
    action.payload.callback();
  }
  return newState;
};

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.action) {
      case "setProject":
        return setProject(state, action);
      case "setActiveElement":
        return setActiveElement(state, action);
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch, find }}>{children}</Provider>;
};

export { store, StateProvider };
