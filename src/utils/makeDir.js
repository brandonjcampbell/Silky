const fs = window.require("fs");
const homedir = window.require("os").homedir();

const makeDir = (name) => {
  let initialState = {
    project: name,
    cursor: null,
    actors: [],
    content: [],
  };

  if (!fs.existsSync(`${homedir}\\.silky\\${name}`)) {
    fs.mkdir(`${homedir}\\.silky\\${name}`, function () {});
    fs.writeFileSync(
      `${homedir}\\.silky\\${name}\\silky.json`,
      JSON.stringify(initialState)
    );
  }
};

export default makeDir;
