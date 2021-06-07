const {app, BrowserWindow, ipcMain} = require('electron')
const isDev = require('electron-is-dev');   
const path = require('path')
const fs = require('fs')



function createWindow () {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  const startURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startURL);



    // Without checking if dir already exists
    if (!fs.existsSync(`${app.getPath('home')}\\.silky`)) fs.mkdir(`${app.getPath('home')}\\.silky`,function(){});
    
    // With checking if dir already exists
    //if (!fs.existsSync('.silky')) fs.mkdir('.silky');

}


app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})