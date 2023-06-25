const fs = window.require("fs");
const homedir = window.require("os").homedir();

const renameDir = (name,newName) => {
  if (fs.existsSync(`${homedir}\\.silky\\${name}`) && !fs.existsSync(`${homedir}\\.silky\\${newName}`)) {
    fs.renameSync(`${homedir}\\.silky\\${name}`,`${homedir}\\.silky\\${newName}`);
  }
};

export default renameDir;
