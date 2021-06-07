import React, {createContext, useReducer} from 'react';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import loadFile from './utils/loadFile';
import saveFile from './utils/saveFile'
const homedir = window.require('os').homedir()

let initialState = {
  project:"unset",
    actors:[ 

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
 content:[]

};

const store = createContext(initialState);
const { Provider } = store;

const setProject= (state,action) =>{
  const results = loadFile(`${homedir}\\.silky\\${action.payload.name}\\silky.json`)
  if(results){
    return results
  }
  else {
    let newState = _.cloneDeep(initialState)
    newState.project =  action.payload.name
    return newState
  }
}

const saveProject = (state) =>{
  const results = saveFile(`${homedir}\\.silky\\${state.project}\\silky.json`,state)
}

const add = (state,action) =>{
    let newState = _.cloneDeep(state)
    action.payload.uuid = uuidv4()
    action.payload.type = action.for
    action.payload.class = action.class
    newState.actors = [action.payload,...state.actors]
    saveProject(newState)
    return newState;
}

const remove = (state,action)=>{
    let newState = _.cloneDeep(state)
    newState.actors = [...state.actors.filter(x=>x.uuid!==action.payload)]
    saveProject(newState)
   return newState;
}

const find = (state,id) =>{
   let result = state.state.actors.filter(x=>x.uuid===id)[0]
   console.log(result)
    return result
 }

const getDisplayName = (state,payload)=>{ 
    console.log("payloooad stately",state) 
    if(payload.class==="actor"){
        return payload.name
    }
    if(payload.class==="axiom"){
        const subject = find(state,payload.subject)
        const target = find(state,payload.target)
        return `${getDisplayName(state,subject)} ${payload.name} ${getDisplayName(state,target)}`
    }
}


const saveContent = (state,action) =>{
  let newState = _.cloneDeep(state)
  newState.content = [{ uuid:action.payload.uuid,data:action.payload.content},...state.content.filter(x=>x.uuid!==action.payload.uuid)]
  saveProject(newState)
  return newState;
}


const StateProvider = ( { children } ) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch(action.action) {
      case 'add':
            return add(state,action);
      case 'remove':
            return remove(state,action);
      case 'setProject':
            return setProject(state,action);
      case 'saveContent':
              return saveContent(state,action);
      default:
        throw new Error();
    };
  }, initialState);

  return <Provider value={{ state, dispatch, getDisplayName }}>{children}</Provider>;
};

export { store, StateProvider}