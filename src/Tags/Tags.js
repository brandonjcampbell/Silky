import React, { useContext, useState, useEffect } from "react";
import { store } from "../MyContext";
import _ from "lodash";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import CreateIcon from "@material-ui/icons/Create";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ExtensionIcon from "@material-ui/icons/Extension";
import {Redirect } from "react-router-dom";



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

  const taggedSnippets = globalState.state.actors.filter(
    (x) =>
      x.type === "snippet" &&
      x.tags &&
      x.tags.split(",").find((x) => x === active)
  );
  const taggedElements = globalState.state.actors.filter(
    (x) =>
      x.type === "element" &&
      x.tags &&
      x.tags.split(",").find((x) => x === active)
  );

  return (
    <div div style={{ padding: "10px" }}>
                  {globalState.state.project==="Silky" && <Redirect to="/" />}

      <div style={{ padding: "10px" }}>
        {tags.map((x) => (
          <Chip
            label={x}
            icon={<LocalOfferIcon />}
            onClick={() => setActive(x)}
            style={{ margin: "2px" }}
          ></Chip>
        ))}
      </div>
      {active && <div>
        <h1 style={{ color: "white", padding: "10px" }}>
          <LocalOfferIcon /> {active}
        </h1>
        <div style={{ display: "flex" }}>
          <div style={{ color: "white", padding: "10px" }}>
            <h2 style={{ padding: "10px" }}>
              <ExtensionIcon /> Elements
            </h2>
            {taggedElements.map((x) => (
              <div> {x.name}</div>
            ))}
          </div>

          <div style={{ color: "white" }}>
            <h2 style={{ padding: "10px" }}>
              <CreateIcon /> Snippets
            </h2>
            {taggedSnippets.map((x) => (
              <div> {x.name}</div>
            ))}
          </div>

          <div style={{ color: "white" }}>
            <h2 style={{ padding: "10px" }}>
              <LinearScaleIcon /> Threads
            </h2>
            {globalState.state.actors
              .filter(
                (x) =>
                  x.type === "thread" &&
                  x.sequence &&
                  x.sequence.find((y) =>
                    [...taggedSnippets, ...taggedElements]
                      .map((z) => z.uuid)
                      .includes(y.uuid)
                  )
              )
              .map((x) => (
                <div> {x.name}</div>
              ))}
          </div>
        </div>
      </div>}
    </div>
  );
};

export default Tags;
