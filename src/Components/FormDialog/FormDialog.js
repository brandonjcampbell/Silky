import React, { useContext, useState, useEffect } from "react";
import { store } from "../../NewContext";
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
  handleClose,
  handleConfirm
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const globalState = useContext(store);

  const { dispatch } = globalState;





  const handleNativeConfirm = () => {
   handleConfirm();
    handleClose();
  };

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      handleClose();
    }
  };

  return (
    <>
      <Dialog open={open || passOpen} onClose={handleClose}>
        <DialogContent className="dialog">
          Are you sure?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleNativeConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
