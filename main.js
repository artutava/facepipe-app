const { app, BrowserWindow, ipcMain} = require('electron')

const path = require('node:path')
const fs = require('fs');

let win;

const createWindow = () => {
    win = new BrowserWindow({
      width: 1920,
      height: 1080,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
  
    win.loadFile('dist/index.html');
    win.webContents.openDevTools();
  }

  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

ipcMain.on('get-csv-files', (event, dirPath) => {
    console.log("Attempting to read directory:", dirPath);
    
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            event.returnValue = [];
            return;
        }
        const csvFiles = files.filter(file => path.extname(file) === '.csv');
        console.log('CSV Files:', csvFiles);
        event.returnValue = csvFiles;
    });
});

