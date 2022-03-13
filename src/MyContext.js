import React, { createContext, useReducer } from "react";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import loadFile from "./utils/loadFile";
import saveFile from "./utils/saveFile";
const homedir = window.require("os").homedir();

let initialState = {
  project: "Silky",
  cursor: null,
  actors: [],
  content: [],
};

const store = createContext(initialState);
const { Provider } = store;
const empty = {
  entityMap: {},
  blocks: [
    {
      key: "637gr",
      text: "",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
  ],
};

const setProject = (state, action) => {
  const results = loadFile(
    `${homedir}\\.silky\\${action.payload.name}\\silky.json`
  );
  if (results) {
    return results;
  } else {
    let newState = _.cloneDeep(initialState);
    newState.project = action.payload.name;
    return newState;
  }
};

const saveProject = (state) => {
  const results = saveFile(
    `${homedir}\\.silky\\${state.project}\\silky.json`,
    state
  );
  saveTextFile(state);
};

const saveTextFile = (state) => {
  let text = "==== Snippets ====";
  state.actors
    .filter((x) => x.type === "snippet")
    .map((x) => {
      text += `\n\n ${x.name}`;
      if (x.content && x.content.blocks) {
        x.content.blocks.map((y) => {
          if (y.text) {
            text += `\n ${y.text}`;
          }
        });
      }
    });

  text += `\n\n\n\n==== Elements ====`;
  state.actors
    .filter((x) => x.type === "element")
    .map((x) => {
      text += `\n\n ${x.name}`;
      if (x.content && x.content.blocks) {
        x.content.blocks.map((y) => {
          if (y.text) {
            text += `\n ${y.text}`;
          }
        });
      }
    });

  text += `\n\n\n\n==== Threads ====`;
  state.actors
    .filter((x) => x.type === "thread")
    .map((x) => {
      text += `\n\n ${x.name}`;
      if (x.sequence) {
        x.sequence.map((y) => {
          const result = state.actors.find((z) => z.uuid === y.uuid);
          if (result && result.name) {
            text += `\n ${result.name}`;
          }
        });
      }
    });

  const results = saveFile(
    `${homedir}\\.silky\\${state.project}\\silky.txt`,
    text
  );
};

const add = (state, action) => {
  let newState = _.cloneDeep(state);
  action.payload.uuid = uuidv4();
  action.payload.type = action.for;
  action.payload.class = action.class;
  if (action.for === "snippet") {
    action.payload.elements = [];
    action.payload.content = _.cloneDeep(empty);
    action.payload.content.blocks[0].text = `[${action.payload.name}]`;
    [...action.payload.name.split(" ")].forEach((word) => {
      const ac = state.actors.filter((actor) => actor.name === word)[0];
      if (ac) {
        action.payload.elements.push({ uuid: ac.uuid });
      }
    });
  }
  newState.actors = [action.payload, ...state.actors];
  saveProject(newState);
  if (action.payload.callback) {
    action.payload.callback(action.payload.uuid);
  }
  return newState;
};

const remove = (state, action) => {
  let newState = _.cloneDeep(state);
  newState.actors = [
    ...state.actors.filter((x) => x.uuid !== action.payload.uuid),
  ];
  saveProject(newState);
  return newState;
};

const find = (state, id) => {
  let result = state.state.actors.find((x) => x.uuid === id);
  return result;
};

const saveContent = (state, action) => {
  let newState = _.cloneDeep(state);

  newState.content = [
    { uuid: action.payload.uuid, data: action.payload.content },
    ...state.content.filter((x) => x.uuid !== action.payload.uuid),
  ];

  saveProject(newState);
  return newState;
};

const saveActor = (state, action) => {
  let newState = _.cloneDeep(state);

  newState.actors = state.actors.map((x) => {
    if (x.uuid !== action.payload.actor.uuid) {
      return x;
    } else {
      return action.payload.actor;
    }
  });
  saveProject(newState);
  return newState;
};

const reorderActors = (state, action) => {
  let newState = _.cloneDeep(state);
  newState.actors = state.actors.filter(
    (x) => !action.payload.actors.map((y) => y.uuid).includes(x.uuid)
  );
  newState.actors = [...action.payload.actors, ...newState.actors];
  saveProject(newState);
  return newState;
};

const saveActors = (state, action) => {
  let newState = _.cloneDeep(state);
  //do not effect any actors that aren't of the designated type
  newState.actors = state.actors.filter((x) => x.type !== action.for);
  newState.actors = [...action.payload.actors, ...newState.actors];
  saveProject(newState);
  return newState;
};

const removeActor = (state, action) => {

    let newState = _.cloneDeep(state);
    newState.actors = state.actors
      .filter((x) => x.uuid !== action.payload.uuid)
      .map((actorx) => {
        let actory = _.cloneDeep(actorx);
        if (actory.sequence) {
          actory.sequence = [
            ...actorx.sequence.filter((y) => y.uuid !== action.payload.uuid),
          ];
        }
        if (actory.elements) {
          actory.elements = [
            ...actorx.elements.filter((y) => y.uuid !== action.payload.uuid),
          ];
        }
        return actory;
      });
    saveProject(newState);
    return newState;

};

const duplicate = (state, action) => {
  let target = state.actors.find((x) => x.uuid === action.payload.uuid);
  if (target) {
    let actory = _.cloneDeep(target);
    let newState = _.cloneDeep(state);

    actory.uuid = uuidv4();
    actory.name = actory.name + " Copy";
    newState.actors.unshift(actory);

    saveProject(newState);
    return newState;
  }
  return null;
};

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.action) {
      case "add":
        return add(state, action);
      case "remove":
        return remove(state, action);
      case "setProject":
        return setProject(state, action);
      case "saveContent":
        return saveContent(state, action);
      case "saveActor":
        return saveActor(state, action);
      case "removeActor":
        return removeActor(state, action);
      case "saveActors":
        return saveActors(state, action);
      case "reorderActors":
        return reorderActors(state, action);
      case "duplicate":
        return duplicate(state, action);
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch, find }}>{children}</Provider>;
};

export { store, StateProvider };
