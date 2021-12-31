import React, { createContext, useReducer } from "react";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import loadFile from "./utils/loadFile";
import saveFile from "./utils/saveFile";
const homedir = window.require("os").homedir();

let initialState = {
  project: "Silky",
  cursor: null,
  actors: [
    // {name: "that", subject: "c41914d3-ee08-4f30-b3ec-7c286e4a2536", target: "2011aa60-548e-4d26-a7be-d9c22f96b081", uuid: "b5877f82-0e2e-4934-b51f-fd708449ab1c", type: "link",  class: "axiom"}
    // ,{name: "is", subject: "a3bb38a6-8971-4e34-aa28-767cdebbf0ec", target: "c0f92045-5a06-4a6e-8224-eeef504ed9ee", uuid: "c41914d3-ee08-4f30-b3ec-7c286e4a2536", type: "link",  class: "axiom"}
    // ,{name: "unaware", uuid: "c0f92045-5a06-4a6e-8224-eeef504ed9ee", type: "fact", class: "actor"}
    // ,{name: "that", subject: "705a7094-4804-49e5-99a5-9040556940b8", target: "d312452b-cb09-4431-b07e-29b3b81cd2ee", uuid: "bf2061ff-6207-4374-9fe5-bf27a033ced1", type: "link",  class: "axiom"}
    // ,{name: "is", subject: "a3bb38a6-8971-4e34-aa28-767cdebbf0ec", target: "53e09d24-03aa-4ff9-a8bd-2105e79784bf", uuid: "705a7094-4804-49e5-99a5-9040556940b8", type: "link",  class: "axiom"}
    // ,{name: "amused", uuid: "53e09d24-03aa-4ff9-a8bd-2105e79784bf", type: "fact", class: "actor"}
    // ,{name: "because", subject: "d312452b-cb09-4431-b07e-29b3b81cd2ee", target: "d65034d5-572c-4133-9eb1-a0cf42969345", uuid: "2011aa60-548e-4d26-a7be-d9c22f96b081", type: "link",  class: "axiom"}
    // ,{name: "carries", subject: 1, target: "5c64be57-905b-463f-801c-54209390fdf4", uuid: "d312452b-cb09-4431-b07e-29b3b81cd2ee", type: "link",  class: "axiom"}
    // ,{name: "flashlight", uuid: "5c64be57-905b-463f-801c-54209390fdf4", type: "fact", class: "actor"}
    // , {name: "fears", subject: 1, target: "b5c66a5a-1fc7-407a-bb1d-0094ce52faeb", uuid: "d65034d5-572c-4133-9eb1-a0cf42969345", type: "link", class: "axiom"}
    // , {name: "the dark", uuid: "b5c66a5a-1fc7-407a-bb1d-0094ce52faeb", type: "fact", class: "actor"}
    // , {name: "Hathaway", uuid: "a3bb38a6-8971-4e34-aa28-767cdebbf0ec", type: "character", class: "actor"}
    // , {name: "Cameron", uuid: 1, type: "character", class: "actor"}
  ],
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
};

const add = (state, action) => {
  let newState = _.cloneDeep(state);
  action.payload.uuid = uuidv4();
  action.payload.type = action.for;
  action.payload.class = action.class;
  console.log("Let's see", action.for);
  if (action.for === "snippet") {
    console.log("gloopy");
    action.payload.elements = [];
    action.payload.content = _.cloneDeep(empty);
    action.payload.content.blocks[0].text = `[${action.payload.name}]`;
    console.log("SNOOKER", [...action.payload.name.split(" ")]);
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
  let result = state.state.actors.filter((x) => x.uuid === id)[0];
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
  console.log("Save actor!");
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
  console.log(
    "the UUIDS of the updated actors",
    action.payload.actors.map((y) => y.uuid)
  );
  newState.actors = state.actors.filter(
    (x) => !action.payload.actors.map((y) => y.uuid).includes(x.uuid)
  );
  console.log("all the UNRELATED actors", newState.actors);
  console.log("all the UPDATED actors", action.payload.actors);
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
      default:
        throw new Error();
    }
  }, initialState);

  return <Provider value={{ state, dispatch, find }}>{children}</Provider>;
};

export { store, StateProvider };
