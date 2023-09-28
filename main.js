const { app, BrowserWindow, ipcMain } = require("electron");

const path = require("node:path");
const fs = require("fs");

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("dist/index.html");
  win.webContents.openDevTools();
  win.webContents.session.on("will-download", (_event, item, _webContents) => {
    console.log("Current folder ", global.currentFolder);
    let downloadPath = getCurrentSceneFolder();
    item.setSavePath(downloadPath + "/" + item.getFilename());

    item.resume();
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("get-csv-files", (event, dirPath) => {
  let folderPath = getCurrentSceneFolder();

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      event.returnValue = [];
      return;
    }
    const csvFiles = files.filter((file) => path.extname(file) === ".csv");
    event.returnValue = csvFiles;
  });
});

ipcMain.on("get-folders", (event, dirPath) => {
  const folderPath = getDocumentsFolder();

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Erro ao ler o diretório:", err);
      event.returnValue = [];
      return;
    }

    const folders = [];
    files.forEach((file) => {
      const itemPath = `${folderPath}/${file}`;
      const isDirectory = fs.statSync(itemPath).isDirectory();

      if (isDirectory) {
        folders.push(file);
      }
    });
    if (!folders.length) {
      fs.mkdirSync(path.join(folderPath, "Scene 1"), { recursive: true });
    }

    event.returnValue = folders;
  });
});

ipcMain.on("get-date-file", (event, fileName) => {
  const sceneFolder = getCurrentSceneFolder();
  const fileStat = fs.statSync(path.join(sceneFolder, fileName));
  event.returnValue = fileStat?.mtime;
});

ipcMain.on("create-folder", (event, dirPath) => {
  const folderPath = getDocumentsFolder();

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Erro ao ler o diretório:", err);
      event.returnValue = [];
      return;
    }

    const folders = [];
    files.forEach((file) => {
      const itemPath = path.join(folderPath, file);
      const isDirectory = fs.statSync(itemPath).isDirectory();

      if (isDirectory) {
        folders.push(file);
      }
    });
    fs.mkdirSync(path.join(folderPath, `Scene ${files.length + 1}`), {
      recursive: true,
    });

    event.returnValue = folders;
  });
});

ipcMain.on("set-current-folder", (event, folder) => {
  global.currentFolder = folder;
  event.returnValue = folder;
});

ipcMain.on("delete-folders", (event, folders) => {
  const documentsPath = getDocumentsFolder();
  folders.forEach(folder => {
    fs.rmSync(path.join(documentsPath, folder), { recursive: true, force: true });
  })
  event.returnValue = true; 

});

ipcMain.on("delete-files", (event, files) => {
  const sceneFolder = getCurrentSceneFolder();
  files.forEach(file => {
    fs.rmSync(path.join(sceneFolder, file), { recursive: true, force: true });
  })
  event.returnValue = true;
});



function getDocumentsFolder() {
  const documentsPath = app.getPath("documents");
  let folderPath = path.join(documentsPath, "facepipe");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return folderPath;
}

function getCurrentSceneFolder() {
  const documentsFolder = getDocumentsFolder();
  const folderPath = path.join(documentsFolder, global.currentFolder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}
