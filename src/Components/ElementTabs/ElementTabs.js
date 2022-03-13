import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@material-ui/core/Chip";
import TabPanel from "../TabPanel";
import SimpleList from "../SimpleList";
import Tesseract from "tesseract.js";
import FormDialog from "../FormDialog";

import FormControl from "@material-ui/core/FormControl";
import { getDisplayName } from "../../utils";
import Autocomplete from "@mui/material/Autocomplete";
import "./ElementTabs.css";

import { TiScissors } from "react-icons/ti";
import { GiSewingString, GiLightBulb } from "react-icons/gi";
import { AiFillTag } from "react-icons/ai";

const homedir = window.require("os").homedir();
const useStyles = makeStyles({
  root: {
    background: "#333",
    color: "white",
    width: "200px",
    padding: "5px",
    margin: "5px",
  },
  subSection: {
    color: "white",
  },
  p: {
    color: "#777",
  },
  link: {
    "text-decoration": "none",
    color: "#777",
  },
});
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}
const ElementTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  if(!actor.facts){
    actor.facts=[]
  }

  const tagSave = (newTags) => {
    actor.tags = newTags;
    setTags(newTags);
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  const getThreads = () => {
    const snippets = globalState.state.actors
      .filter(
        (snippet) =>
          snippet.type === "snippet" &&
          snippet.elements &&
          snippet.elements
            .map((y) => {
              return y.uuid;
            })
            .includes(actor.uuid)
      )
      .map((y) => y.uuid);

    const threads = globalState.state.actors.filter(
      (thread) =>
        thread.type === "thread" &&
        thread.sequence &&
        thread.sequence.filter((z) => {
          return snippets.includes(z.uuid);
        }).length > 0
    );

    return _.uniqBy(threads, "uuid");
  };

  function addToFacts(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts.push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "snippet",
      payload: { actor: clone },
    });
  }

  function removeFromFacts(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts = clone.facts.filter((x) => x.uuid !== uuid);
    dispatch({
      action: "saveActor",
      for: "snippet",
      payload: { actor: clone },
    });
  }

  var video = document.querySelector(".videoElement");

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
      })
      .catch(function (err0r) {
        console.log("Something went wrong!");
      });
  } else {
    console.log("not allowed");
  }

  // Get handles on the video and canvas elements
  var video = document.querySelector(".videoElement");
  var canvas = document.querySelector("canvas");
  // Get a handle on the 2d context of the canvas element
  if (canvas) {
    var context = canvas.getContext("2d");
    // Define some vars required later
    var w, h, ratio;

    // Add a listener to wait for the 'loadedmetadata' state so the video's dimensions can be read
    video.addEventListener(
      "loadedmetadata",
      function () {
        // Calculate the ratio of the video's width to height
        ratio = video.videoWidth / video.videoHeight;
        // Define the required width as 100 pixels smaller than the actual video's width
        w = video.videoWidth - 100;
        // Calculate the height based on the video's width and the ratio
        h = parseInt(w / ratio, 10);
        // Set the canvas width and height to the values just calculated
        canvas.width = w;
        canvas.height = h;
      },
      false
    );
  }

  const grayscale = function (pixels) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];

      // CIE luminance for the RGB
      // The human eye is bad at seeing red and blue, so we de-emphasize them.
      // var v = r + g + b;
      if (r - g > 13 && r - b > 23) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
      } else {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      }
    }
    return pixels;
  };

  const redButton = function (pixels, h, w) {
    var d = _.cloneDeep(pixels.data);
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];

      // CIE luminance for the RGB
      // The human eye is bad at seeing red and blue, so we de-emphasize them.
      // var v = r + g + b;
      if (r - g > 13 && r - b > 23 && r > 100) {
        d[i] = 1;
        d[i + 1] = 1;
        d[i + 2] = 1;
        d[i + 3] = 1;
      } else {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      }
    }
    let justRed = d.filter((x, index) => index % 4 === 0);
    justRed = d;
    let pix = [];
    //   let m,j, temporary, chunk = w;
    // for (m = 0,j = justRed.length; m < j; m += chunk) {
    //     pix.push(justRed.slice(m, m + chunk));
    //     // do whatever
    // }
    console.log("HI", d);
    justRed.forEach((point, index) => {
      if (point === 1) pix.push(index);
    });

    // for (let ii = 1; ii < h; ii++) {
    //   for (let jj = 1; jj < w; jj++) {
    //     console.log(ii*h + jj*w)
    //     if (justRed[ii*h + jj*w] === 1) {
    //       pix.push([ii, jj]);
    //     }
    //   }
    // }

    return pix;
  };

  // Takes a snapshot of the video
  function snap() {
    // Define the size of the rectangle that will be filled (basically the entire element)
    context.fillRect(0, 0, w, h);
    // Grab the image from the video
    // context.drawImage(video, 0, 0, w, h);
    context.drawImage(video, 0, 0, w, h);

    let resu = context.getImageData(0, 0, w, h);
    // let scanny=redButton(resu,h,w);
    //console.log(scanny)
    resu = grayscale(resu);

    context.putImageData(resu, 0, 0);
    var dataURL = canvas.toDataURL("image/png");

    //var dbscan = new clustering.DBSCAN();
    // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
    //console.log(resu.data,Array.from(resu.data))
    // var clusters = dbscan.run(Array.from(scanny), 5, 2);

    //console.log("clusters",clusters,"noise" ,dbscan.noise);

    Tesseract.recognize(dataURL, "eng", {
      logger: (m) => (document.querySelector(".OCR").innerHTML = m.progress),
    }).then(({ data: { text } }) => {
      document.querySelector(".OCR").innerHTML = text;
    });
  }

  return (
    <div>
      {actor && (
        <div>
          <Box>
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => {
                setCurrentTab(newValue);
              }}
              aria-label="basic tabs example"
            >
              <Tab
                label={<GiLightBulb className="menuItem" />}
                {...a11yProps(1)}
              />
              <Tab
                label={<TiScissors className="menuItem" />}
                {...a11yProps(0)}
              />

              <Tab
                label={<GiSewingString className="menuItem" />}
                {...a11yProps(2)}
              />
              <Tab
                label={<AiFillTag className="menuItem" />}
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>
          <TabPanel className="tabPanel" value={currentTab} index={0}>
            <SimpleList
              type="facts"
              xAction={removeFromFacts}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "fact" &&
                  actor &&
                  actor.facts &&
                  actor.facts.map((x) => x.uuid).includes(a.uuid)
              )}
            />

            <FormControl variant="filled">
              <Autocomplete
                disablePortal
                clearOnBlur
                selectOnFocus
                blurOnSelect
                id="combo-box-demo"
                getOptionLabel={(option) =>
                  option.name +
                  "@tags:" +
                  option.tags +
                  (option.facts
                    ? option.facts
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) => x.type === "fact" 
                  &&
                  actor.facts 
                  &&
                  !actor.facts.map((y) => y.uuid).includes(x.uuid)
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addToFacts(newValue.uuid);
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      <Avatar
                        alt=" "
                        sx={{ bgcolor: option.color ? option.color : "grey" }}
                        src={
                          homedir +
                          "\\.silky\\" +
                          globalState.state.project +
                          "\\" +
                          option.uuid +
                          ".png"
                        }
                      />
                      {props.key.split("@tags:")[0]}
                    </span>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Add a Fact..." />
                )}
              />
            </FormControl>
            <FormDialog type={"fact"} specialOp={addToFacts} />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <SimpleList
              type="snippets"
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "snippet" &&
                  a.elements &&
                  a.elements.map((x) => x.uuid).includes(actor.uuid)
              )}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <SimpleList list={getThreads()} />
          </TabPanel>
          {/* <TabPanel value={currentTab} index={3}>
            <video autoplay="true" className="videoElement"></video>
            <canvas></canvas>
            <button
              id="snap"
              onClick={() => {
                snap();
              }}
            >
              Take screenshot
            </button>
            <p className="OCR"></p>
          </TabPanel> */}
          <TabPanel value={currentTab} index={3}>
            <TextField
              aria-label="empty textarea"
              placeholder="Enter tags as a comma separated list"
              className={classes.root}
              value={tags}
              onChange={(e) => {
                tagSave(e.target.value);
              }}
            />
            <div>
              {tags.split(",").map((tag) => {
                if (tag) {
                  return (
                    <Chip
                      className="tag"
                      label={tag}
                      icon={<LocalOfferIcon />}
                    />
                  );
                }
              })}
            </div>
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default ElementTabs;
