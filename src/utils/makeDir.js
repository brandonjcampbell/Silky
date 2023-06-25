const fs = window.require("fs");
const homedir = window.require("os").homedir();

const makeDir = (name) => {

  if (!fs.existsSync(`${homedir}\\.silky\\${name}`)) {
    fs.mkdirSync(`${homedir}\\.silky\\${name}`);
    fs.mkdirSync(`${homedir}\\.silky\\${name}\\rubbish`);
    
  }
};

export default makeDir;
