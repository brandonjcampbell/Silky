import { pickAndStoreImage, projectDir } from "../storage";

const uploadPic = async (actorUuid, globalState, setFreshener) => {
  const dest = `${projectDir(globalState.state.project)}${actorUuid}.png`;
  const stored = await pickAndStoreImage(dest);
  if (stored && setFreshener) {
    setFreshener(performance.now());
  }
};

export default uploadPic;
