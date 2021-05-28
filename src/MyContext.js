import React, {createContext, useReducer} from 'react';
import { v4 as uuidv4 } from 'uuid';

let initialState = {
    actors:[
        {name:"Cameron", type:"character", uuid:1},
        {name:"Ezra", type:"character", uuid:2},
        {name:"Hathaway", type:"character", uuid:3}
    ]
};

const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ( { children } ) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch(action.action) {
      case 'add':
        action.payload.uuid = uuidv4()
        action.payload.type = action.for
        return {actors:[action.payload,...state.actors]};
      case 'remove':
        return {actors:[...state.actors.filter(x=>x.uuid!==action.payload)]};
      default:
        throw new Error();
    };
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider}