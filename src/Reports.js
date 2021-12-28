import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import _ from "lodash";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Timeline from "./Timeline";
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';

const Reports = () => {
  const globalState = useContext(store);
  const [list, setList] = useState([]);
  const [longest, setLongest] = useState(0);

  function getDisplayName(uuid) {
    return globalState.getDisplayName(
      globalState,
      globalState.find(globalState, uuid)
    );
  }

  useEffect(function(){
    let longest = 0;
    list.forEach((y) => {if(y.totalSequenceLength > longest) {longest=y.totalSequenceLength}});
    setLongest(longest);
  },[list])

  return (
    <div style={{height:"100%",width:"100%", overflow:"auto"}}>

      <br />
      <FormControl variant="filled">
        <InputLabel id="demo-simple-select-outlined-label">Then...</InputLabel>
        <Select
          style={{ width: "200px", color: "white", outlineColor: "white" }}
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          onChange={(e) => {
            console.log(
              globalState.state.actors.find((x) => x.uuid === e.target.value)
            );
            setList([...list,
              globalState.state.actors.find((x) => x.uuid === e.target.value)]
            );
   
          }}
          label="Subject"
        >
          <MenuItem value="">
            <em>Select</em>
          </MenuItem>
          {globalState.state.actors
            .filter((x) => x.type === "thread" && !list.find(y=>y.uuid===x.uuid))
            .map((x) => {
              return (
                <MenuItem value={x.uuid}>{getDisplayName(x.uuid)}</MenuItem>
              );
            })}
        </Select>
      </FormControl>
      {list.map(x=> <div style={{margin:"10px"}}><Button onClick={()=>{ setList(list.filter(y=>y.uuid!==x.uuid))}}><CloseIcon style={{color:"white"}} /></Button><span style={{color:"white"}}>{x.name}</span><Timeline active={x} unit={(100 / longest)} fontSize={10}></Timeline></div>)
     }
      <br />
    </div>
  );
};

export default Reports;
