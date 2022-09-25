import { confirmAlert } from "react-confirm-alert"; // Import

const remove = (actor, dispatch, callback) => {
  confirmAlert({
    title: "Confirm to remove",
    message:
      "Are you sure you want to remove " +
      actor.type +
      " " +
      actor.name +
      "? You won't be able to undo this action.",
    buttons: [
      {
        label: "Yes",
        onClick: () => {
          dispatch({
            action: "removeActor",
            payload: { uuid: actor.uuid, callback: callback },
          });
        },
      },
      {
        label: "No",
        onClick: () => {},
      },
    ],
  });
};

export default remove;
