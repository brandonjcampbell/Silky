import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";

export default function FormDialog({ type }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const globalState = useContext(store);

  const { dispatch } = globalState;

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAdd = () => {
    dispatch({
      action: "add",
      for: type,
      payload: { name: name },
      class: "actor",
    });
    handleClose();
  };

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      handleAdd();
      setName("");
      handleClose();
    }
  };

  return (
    <div>
        <div style={{margin:"10px",textAlign:"left"}}>

   
       
      <Fab color="primary" size="small" aria-label="add" onClick={handleClickOpen}>
        <AddIcon />
      </Fab>
      <span style={{display:"inline-block",margin:"10px",color:"#555"}}>{type}</span>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogContent style={{ width: "500px" }}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            value={name}
            fullWidth
            variant="standard"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={keyPress}
          />

          {/*   
          <TextField
            style={{ color: "white" }}
            id="outlined-basic"
            value={name}
            onKeyDown={keyPress}
            onChange={(e) => setName(e.target.value)}
          /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAdd}>Create {type}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
