const { dialog } = window.require("electron").remote;
const fs = window.require("fs");
const homedir = window.require("os").homedir();
const nativeImage = window.require("electron").nativeImage;

const uploadPic = async (actorUuid, globalState, setFreshener) => {
  // Open a dialog to ask for the file path
  dialog.showOpenDialog({ properties: ["openFile"] }).then(function (data) {
    const filePath = data.filePaths[0];
    if (filePath) {
      const newPath =
        homedir +
        "\\.silky\\" +
        globalState.state.project +
        "\\" +
        actorUuid +
        ".png";
      const image = nativeImage.createFromPath(filePath);
      fs.writeFileSync(newPath, image.resize({ height: 100 }).toPNG());
      if (setFreshener) {
        setFreshener(performance.now());
      }
    }
  });
};

export default uploadPic;
