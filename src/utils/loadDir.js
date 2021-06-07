const fs = window.require('fs');
const homedir = window.require('os').homedir()

const loadDir = () =>{
    
    const data = fs.readdirSync(`${homedir}\\.silky`)
    return data;
}
export default loadDir