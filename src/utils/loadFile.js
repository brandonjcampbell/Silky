const fs = window.require("fs");
const loadFile = (filepath) => {
  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath);
    return JSON.parse(data);
  } else return null;
};
export default loadFile;
