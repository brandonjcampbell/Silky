import React from "react";
import _ from "lodash";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const TabPanel = ({ children, value, index, ...other })=> {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default TabPanel;