import { writeFileSync } from "../storage";
const createFile = (filepath, content) => {
  writeFileSync(filepath, typeof content !== "string" ? JSON.stringify(content) : content);
};
export default createFile;
