import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import _ from "lodash";

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

  return (
    <div>
      <div>
        {tags.map((x) => (
          <Chip label={x} onClick={() => setActive(x)}></Chip>
        ))}
      </div>
      <div>
        <h1>{active}</h1>
        <div>
            {globalState.state.actors.filter(x=>x.tags && x.tags.includes(active)).map(x=><div>{x.name}</div>)}
        </div>
      </div>
    </div>
  );
};

export default Tags;
