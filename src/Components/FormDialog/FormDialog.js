import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import AddIcon from "@mui/icons-material/Add";
import "./FormDialog.css";

export default function FormDialog({
  type,
  specialOp,
  button = true,
  passOpen = false,
  handleCloseExtra,
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const globalState = useContext(store);

  const { dispatch } = globalState;

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setName("");
    setOpen(false);
    if (handleCloseExtra) {
      handleCloseExtra();
    }
  };

  const handleAdd = () => {
    dispatch({
      action: "add",
      for: type,
      payload: {
        name: name,
        callback: (e) => {
          if (specialOp) {
            specialOp(e);
          }
        },
      },
      class: "actor",
    });
    if (specialOp) {
    }
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
      {button && (
        <div>
          <Button
            className="addButton"
            color="primary"
            size="small"
            aria-label="add"
            onClick={handleClickOpen}
          >
            <AddIcon /> {type}
          </Button>
        </div>
      )}

      <Dialog open={open || passOpen} onClose={handleClose}>
        <DialogContent className="dialog">
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAdd}>Create {type}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
