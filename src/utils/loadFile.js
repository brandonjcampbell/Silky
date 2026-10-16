import { existsSync, readFileSync } from "../storage";
const loadFile = (filepath) => {
  if (existsSync(filepath)) {
    return JSON.parse(readFileSync(filepath));
  } else return null;
};
export default loadFile;
