const fs = window.require("fs");
const homedir = window.require("os").homedir();

const deleteDir = (name) => {

  if (fs.existsSync(`${homedir}\\.silky\\${name}`)) {
    fs.rmSync(`${homedir}\\.silky\\${name}`, { recursive: true, force: true });
  }
};

export default deleteDir;
