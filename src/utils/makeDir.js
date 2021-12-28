const fs = window.require('fs');
const homedir = window.require('os').homedir()

const makeDir = (name) =>{
    if (!fs.existsSync(`${homedir}\\.silky\\${name}`)) fs.mkdir(`${homedir}\\.silky\\${name}`,function(){});
}

export default makeDir