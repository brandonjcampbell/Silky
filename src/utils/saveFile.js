import { writeFileSync } from "../storage";
const saveFile = (filepath, content) => {
  writeFileSync(filepath, typeof content !== "string" ? JSON.stringify(content) : content);
};
export default saveFile;
