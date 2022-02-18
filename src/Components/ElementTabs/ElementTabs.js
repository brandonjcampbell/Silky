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
import clustering from "density-clustering";
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
      if (r - g > 13 && r - b > 23 && r>100) {
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
    console.log("HI",d)
    justRed.forEach((point,index)=> {

      
      if(point===1)
      pix.push(index
    )})

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
              <Tab label="Snippets" {...a11yProps(0)} />
              <Tab label="Tags" {...a11yProps(1)} />
              <Tab label="Threads" {...a11yProps(2)} />
              <Tab label="Sparks" {...a11yProps(2)} />
            </Tabs>
          </Box>
          <TabPanel value={currentTab} index={0}>
            <SimpleList
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "snippet" &&
                  a.elements &&
                  a.elements.map((x) => x.uuid).includes(actor.uuid)
              )}
            />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
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
          <TabPanel value={currentTab} index={2}>
            <SimpleList list={getThreads()} />
          </TabPanel>
          <TabPanel value={currentTab} index={3}>
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
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default ElementTabs;
