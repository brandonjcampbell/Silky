//var remote = require('electron')

const { ipcRenderer } = require('electron');

            // Some data that will be sent to the main process
            let Data = {
                message: "Hi",
                someData: "Let's go"
            };

            // Send information to the main process
            // if a listener has been set, then the main process
            // will react to the request !
           

//const {app, BrowserWindow} = require('electron')

const loadFile = () =>{
    //ipcRenderer.send('load-file', Data);
//console.log(BrowserWindow)
//const data = fs.readFile('C:\Users\KelLynn\Desktop\Silky\silky.json')
 //console.log(data)


}
export default loadFile