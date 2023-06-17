const fs = window.require("fs");
const moveFile = (filepath,newFilepath) => {
  if (fs.existsSync(filepath)) {
    const data = fs.renameSync(filepath,newFilepath);
    console.log("all done moving!")
    return true;
  } else return false;
};
export default moveFile;
