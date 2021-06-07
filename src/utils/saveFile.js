const fs = window.require('fs');
const saveFile = (filepath,content) =>{
    fs.writeFileSync(filepath,JSON.stringify(content))
}
export default saveFile