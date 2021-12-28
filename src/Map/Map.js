import React, { useContext, useState, useEffect } from "react";
import { store } from "../MyContext";
import { BsTreeFill, BsEraserFill } from "react-icons/bs";
import { FaBuilding, FaMountain, FaStamp } from "react-icons/fa";
import { MdCottage, MdClose } from "react-icons/md";
import { BiWater } from "react-icons/bi";
import { GiGrass, GiGrassMushroom, GiBrickWall } from "react-icons/gi";
import { AiFillFire } from "react-icons/ai";
import { IoThunderstorm } from "react-icons/io5";
import { useMousePosition } from "../utils/";
import { ColorPicker } from "material-ui-color";

import "./map.css";
const homedir = window.require("os").homedir();

const Map = ({ data }) => {
  const globalState = useContext(store);

  const { dispatch } = globalState;
  const position = useMousePosition();

  const [landmarks, setLandmarks] = useState([]);

  const options = [
    "BsTreeFill",
    "FaBuilding",
    "MdCottage",
    "BiWater",
    "FaMountain",
    "MdClose",
    "GiGrass",
    "GiGrassMushroom",
    "AiFillFire",
    "IoThunderstorm",
    "GiBrickWall",
  ];
  const optionMap = {
    BsTreeFill,
    FaBuilding,
    MdCottage,
    BiWater,
    FaMountain,
    MdClose,
    GiGrass,
    GiGrassMushroom,
    AiFillFire,
    IoThunderstorm,
    GiBrickWall,
  };

  const [scale, setScale] = useState(100);

  const [selectedOption, setSelectedOption] = useState(options[0]);

  const [color, setColor] = useState({ hex: "white" });

  const renderOption = (option, optColor) => {
    const Component = optionMap[option];
    return <Component style={{ color: optColor }} />;
  };
  return (
    <div className="grid">
      <div></div>
      <div style={{ display: "flex" }}>
        <div style={{ border: "1px solid #333" }}>
          <h3>Tool</h3>
          <FaStamp color="white" />
          <BsEraserFill color="white" />
        </div>

        <div style={{ border: "1px solid #333" }}>
          <h3>Brush</h3>
          {options.map((x) => (
            <div
              style={{
                display: "inline-block",
                margin: "10px",
                padding: "5px",
                transform: "scale(150%)",
                borderRadius: "100px",
                backgroundColor: x === selectedOption ? "#333" : "transparent",
              }}
              onClick={() => {
                setSelectedOption(x);
              }}
            >
              {" "}
              {renderOption(x, color.hex)}{" "}
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid #333" }}>
          <h3>Scale</h3>

          <div
            style={{
              display: "inline-block",
              margin: "10px",
              borderRadius: "100px",
              backgroundColor: scale === 100 ? "#333" : "transparent",
            }}
            onClick={() => {
              setScale(100);
            }}
          >
            {renderOption(selectedOption, color.hex)}
          </div>
          <div
            style={{
              display: "inline-block",
              transform: "scale(150%)",
              margin: "10px",
              borderRadius: "100px",
              padding: "5px",
              backgroundColor: scale === 150 ? "#333" : "transparent",
            }}
            onClick={() => {
              setScale(150);
            }}
          >
            {renderOption(selectedOption, color.hex)}
          </div>
          <div
            style={{
              display: "inline-block",
              transform: "scale(200%)",
              borderRadius: "100px",
              padding: "5px",
              backgroundColor: scale === 200 ? "#333" : "transparent",
              margin: "10px",
            }}
            onClick={() => {
              setScale(200);
            }}
          >
            {renderOption(selectedOption, color.hex)}
          </div>
          <div
            style={{
              display: "inline-block",
              transform: "scale(400%)",
              borderRadius: "100px",
              padding: "5px",
              backgroundColor: scale === 400 ? "#333" : "transparent",
              margin: "40px",
            }}
            onClick={() => {
              setScale(400);
            }}
          >
            {renderOption(selectedOption, color.hex)}
          </div>
        </div>
        <div style={{ border: "1px solid #333" }}>
          <h3>Color</h3>
          <ColorPicker
            style={{ display: "inline-block" }}
            hideTextfield
            value={color}
            onChange={(e) => setColor(e)}
          />
          {position.x}:{position.y} {color.hex}
        </div>
      </div>
      {landmarks.map((x) => (
        <div
          style={{
            position: "absolute",
            left: x.x,
            top: x.y,

            transform: `scale(${x.scale ? x.scale : 100}%)`,
          }}
        >
          {renderOption(x.icon, x.color)}
        </div>
      ))}
      <div
        className="innerGrid"
        onClick={() => {
          if (position.y > 250 && position.x > 300) {
            setLandmarks([
              ...landmarks,
              {
                x: position.x,
                y: position.y,
                icon: selectedOption,
                scale: scale,
                color: color.hex,
              },
            ]);
          }
        }}
      ></div>
    </div>
  );
};

export default Map;
