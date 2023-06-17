const fs = window.require("fs");
const homedir = window.require("os").homedir();

const loadDir = (path) => {
  if(!path){
    path =`${homedir}\\.silky\\`
  }
  let data = fs.readdirSync(path);
  // data = data.filter((x) => {
  //   return fs.existsSync(`${homedir}\\.silky\\${x}\\silky.json`);
  // });
  return data;
};
export default loadDir;
