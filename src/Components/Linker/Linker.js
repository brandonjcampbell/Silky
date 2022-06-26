import React, { useContext } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LopsidedList from "../LopsidedList";
import link from "../../utils/link";
import FormControl from "@material-ui/core/FormControl";
import Autocomplete from "@mui/material/Autocomplete";

const Linker = ({ actor, guestType, linkType, side = "target" }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  return (
    <div>
      <LopsidedList
        type="link"
        side={side}
        guestType={guestType}
        hostType={actor.type}
        xAction={(uuid) => {
          dispatch({
            action: "removeActor",
            payload: { uuid: uuid },
          });
        }}
        list={globalState.state.actors.filter(
          (a) =>
            a.type === "link" &&
            a.name === linkType &&
            a[side === "target" ? "subjects" : "targets"] &&
            a[side === "target" ? "subjects" : "targets"].includes(actor.uuid)
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
            JSON.stringify(
              globalState.state.actors
                .filter(
                  (x) =>
                    x.type === "tag" &&
                    globalState.state.actors.find(
                      (y) =>
                        y.subjects &&
                        y.subjects.includes(x.uuid) &&
                        y.targets &&
                        y.targets.includes(option.uuid)
                    )
                )
                .map((x) => x.name + " ")
            )
          }
          options={globalState.state.actors.filter(
            (x) =>
              x.type === guestType &&
              !globalState.state.actors.find(
                (y) =>
                  y.type === "link" &&
                  y[side === "target" ? "subjects" : "targets"].includes(
                    actor.uuid
                  ) &&
                  y[side === "target" ? "targets" : "subjects"].includes(x.uuid)
              )
          )}
          sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
          onChange={(e, newValue) => {
            if (newValue && newValue !== "Select") {
              console.log(
                "what are we up to?",
                actor.name,
                linkType,
                newValue.name
              );
              link(
                side === "target" ? actor.uuid : newValue.uuid,
                side === "target" ? newValue.uuid : actor.uuid,
                linkType,
                dispatch
              );
            }
          }}
          renderOption={(props, option) => (
            <div {...props}>
              <span> {props.key.split("@tags:")[0]}</span>
            </div>
          )}
          renderInput={(params) => {
            if (params && params.inputProps) {
              params.inputProps.value = null;
            }
            return <TextField {...params} label="" value={null} />;
          }}
        />
      </FormControl>
    </div>
  );
};

export default Linker;
