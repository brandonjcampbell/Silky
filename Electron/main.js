const {app, BrowserWindow, ipcMain} = require('electron')
const isDev = require('electron-is-dev');   
const path = require('path')
const url = require('url');
const fs = require('fs')



function createWindow () {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true,
    }
  })
  const startURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
  //const startURL =  `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startURL);

  if (!fs.existsSync(`${app.getPath('home')}\\.silky`)) fs.mkdir(`${app.getPath('home')}\\.silky`,function(){});


}


app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})