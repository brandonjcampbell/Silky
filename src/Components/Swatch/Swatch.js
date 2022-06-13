import React, { useContext, useState } from "react";
import _ from "lodash";
import { store } from "../../MyContext";
import { ColorPicker } from "material-ui-color";
import "./Swatch.css";
import { SketchPicker } from 'react-color'
import { TextSnippetTwoTone } from "@mui/icons-material";

const Swatch = ({ actor }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [displayColorPicker,setDisplayColorPicker] = useState(false)
  const [color,setColor] = useState("white")

 const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker)
    if(!displayColorPicker){
      updateColor(color)
    }
  };

 const handleClose = () => {
    setDisplayColorPicker(false)
    updateColor(color)
  };

  const handleChange = (test) => {
    console.log(test)
    setColor(test)

  }

  function updateColor(newColor) {
    let clone = _.cloneDeep(actor);
    clone.color = newColor.hex;
    dispatch({
      action: "saveActor",
      for: actor.type,
      payload: { actor: clone },
    });
  }

  const popover = {
    position: 'absolute',
    zIndex: '200',
  }
  const cover = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  }

  return (
    <div>
      <button onClick={ handleClick }>Pick Color</button>
      { displayColorPicker ? <div style={ popover }>
        <div style={ cover } onClick={handleClose}/>
        <SketchPicker color={ color } onChange={ handleChange } />
      </div> : null }
    </div>
  )

  // return (
  // <div className="colorPicker">
  //       <ColorPicker
  //         value={actor.color}
  //         hideTextfield
  //         onChange={(e) => {
  //           updateColor(e);
  //         }}
  //       />
  //     </div> 
  // );
};
export default Swatch;


