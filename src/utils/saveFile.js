const fs = window.require("fs");
const saveFile = (filepath, content) => {
  if (typeof content !== "string") {
    fs.writeFileSync(filepath, JSON.stringify(content));
  } else {
    fs.writeFileSync(filepath, content);
  }
};
export default saveFile;
