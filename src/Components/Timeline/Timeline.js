import React, { useContext } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import {getDisplayName} from "../../utils"

const Timeline = ({ unit, fontSize, active }) => {
  const globalState = useContext(store);

  return (
    <div>
      <div style={{ height: "350px", width: "80vw", paddingLeft: "50px" , background:"#dgdgdg",position:"relative"}}>
        {active &&
          active.sequence &&
          active.sequence.map((x,index) => (
            <div
              style={{
                background: active.color,
                display: "inline-block",
                width: x.incomingEdgeWeight * (unit) + "%",
                height: "3px",
                top:"20px",
                position: "relative",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: (x.consecutive?x.consecutive*2:4)+"px",
                  height: (x.consecutive?x.consecutive*2:4)+"px",
                  background: "white",
                  position: "absolute",
                  right: "0px",
                  padding: "1px",
                  borderRadius: "40px",
                  top: "0px",
                }}
              >
                <div
                  style={{
                    transform: "rotate(45deg)",
                    transformOrigin: "0",
                    position: "absolute",
                    top:  1+(x.consecutive*36)+"px",
                    left:"-9px",
                    width: "250px",
                    height:"20px",
                    overflow:"hidden",
                    color: "white",
                    background:"#232323",
                    padding:"1px",
                    paddingLeft:"20px",
                    borderRadius:"3px",
                    borderBottomRightRadius:"0px",
                    borderBottom:"2px solid white",
                    borderLeft:"2px solid white",
                    borderBottomLeftRadius:"20px",
                    fontSize: fontSize + "pt",
                  }}
                >
              
        
                  {getDisplayName(x.uuid,globalState)} 
                </div>
              </div>
            </div>
          ))}
      </div>

      <div></div>
    </div>
  );
};

export default Timeline;
