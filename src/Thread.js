import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";

const Thread = ({ data }) => {
    const globalState = useContext(store);

  return <div>Threditor {JSON.stringify(data.sequence)}
  
  {data.sequence.map(x=>{return(<div>{globalState.getDisplayName(globalState,(globalState.find(globalState,x)))}</div>)})}
  </div>;
};

export default Thread;
