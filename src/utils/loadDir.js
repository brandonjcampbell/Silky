const fs = window.require('fs');
const homedir = window.require('os').homedir()

const loadDir = () =>{
    
    let data = fs.readdirSync(`${homedir}\\.silky`)
    data = data.filter(x=>{
        console.log(`${homedir}\\.silky\\${x}\\silky.json`,   fs.existsSync(`${homedir}\\.silky\\${x}\\silky.json`) )
        return fs.existsSync(`${homedir}\\.silky\\${x}\\silky.json`) 
    }
        )
    return data;
}
export default loadDir