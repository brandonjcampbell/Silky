import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import _ from "lodash";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import ExtensionIcon from "@material-ui/icons/Extension";
import LinearScaleIcon from "@material-ui/icons/LinearScale";


import Chip from "@material-ui/core/Chip";

const Tags = ({ actorUuid }) => {
  const globalState = useContext(store);
  const [active, setActive] = useState();
  const { dispatch } = globalState;
  let tags = [];
  if (globalState.state.actors) {
    globalState.state.actors.map((x) => {
      if (x.tags) {
        tags = _.uniq([...tags, ...x.tags.split(",")]);
      }
    });
  }

  const taggedActors = globalState.state.actors.filter(x=>x.tags && x.tags.includes(active))

  return (
    <div div style={{padding:"10px"}}>
      <div style={{padding:"10px"}}>
        {tags.map((x) => (
          <Chip label={x} icon={<LocalOfferIcon/>} onClick={() => setActive(x)} style={{ margin: "2px" }}></Chip>
        ))}
      </div>
      <div>
        <h1 style={{color:"white",padding:"10px"}}><LocalOfferIcon/> {active}</h1>
        <div style={{display:"flex"}}>

        <div style={{color:"white",padding:"10px"}}>
            <h2 style={{padding:"10px"}}><ExtensionIcon/> Elements</h2>
            {taggedActors.map(x=><div> {x.name}</div>)}
        </div>

        <div style={{color:"white",padding:"10px"}}>
            <h2 style={{padding:"10px"}}><LinearScaleIcon/> Threads</h2>
            {globalState.state.actors.filter(x=>x.type==="thread" && x.sequence && x.sequence.find(y=>taggedActors.map(z=>z.uuid).includes(y.uuid))).map(x=><div> {x.name}</div>)}
        </div>

        </div>

      </div>
    </div>
  );
};

export default Tags;
