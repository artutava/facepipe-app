const { app, BrowserWindow, ipcMain } = require("electron");
const fsExtra  = require("fs-extra");
const path = require("node:path");
const fs = require("fs");

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: 'assets/icon/icon.png',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("dist/index.html");

  win.webContents.session.on("will-download", (_event, item, _webContents) => {
    const downloadPath = getCurrentSceneFolder();
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

function getDocumentsFolder() {
  const documentsPath = app.getPath("documents");
  const folderPath = path.join(documentsPath, "facepipe");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

function getRecordingFolder() {
  const base = getDocumentsFolder();
  const recPath = path.join(base, "recordings");
  if (!fs.existsSync(recPath)) {
    fs.mkdirSync(recPath, { recursive: true });
  }
  return recPath;
}

function getCurrentSceneFolder() {
  const folderPath = path.join(getRecordingFolder(), global.currentFolder || "Scene 1");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

ipcMain.on("get-csv-files", (event) => {
  const folderPath = getCurrentSceneFolder();
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

ipcMain.on("get-folders", (event) => {
  const folderPath = getRecordingFolder();
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Erro ao ler o diretório:", err);
      event.returnValue = [];
      return;
    }
    const folders = files.filter(file =>
      fs.statSync(path.join(folderPath, file)).isDirectory()
    );
    if (!folders.includes("Scene 1")) {
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

ipcMain.on("create-folder", (event) => {
  const folderPath = getRecordingFolder();
  const files = fs.readdirSync(folderPath);
  const count = files.length + 1;
  fs.mkdirSync(path.join(folderPath, `Scene ${count}`), { recursive: true });
  event.returnValue = fs.readdirSync(folderPath);
});

ipcMain.on("open-explorer", (event) => {
  const os = require("os").platform();
  const cmd = os.startsWith("win") ? "explorer"
            : os === "darwin" ? "open"
            : "xdg-open";
  require("child_process").spawn(cmd, [getDocumentsFolder()]);
  event.returnValue = true;
});

ipcMain.on("set-current-folder", (event, folder) => {
  global.currentFolder = folder;
  event.returnValue = folder;
});

ipcMain.on("delete-folders", (event, folders) => {
  const basePath = getRecordingFolder();
  folders.forEach(folder => {
    fs.rmSync(path.join(basePath, folder), { recursive: true, force: true });
  });
  event.returnValue = true;
});

ipcMain.on("delete-files", (event, files) => {
  const folder = getCurrentSceneFolder();
  files.forEach(file => {
    fs.rmSync(path.join(folder, file), { force: true });
  });
  event.returnValue = true;
});

ipcMain.on("rename-folder", (event, newName, oldName) => {
  const folderBase = getRecordingFolder();
  const oldPath = path.join(folderBase, oldName);
  const newPath = path.join(folderBase, newName);
  try {
    fsExtra.moveSync(oldPath, newPath, { overwrite: true });
  } catch {}
  event.returnValue = true;
});

ipcMain.on("rename-file", (event, newName, oldName) => {
  const sceneFolder = getCurrentSceneFolder();
  const oldPath = path.join(sceneFolder, oldName);
  const newPath = path.join(sceneFolder, newName);
  try {
    fsExtra.moveSync(oldPath, newPath, { overwrite: true });
  } catch {}
  event.returnValue = true;
});

ipcMain.on("generate-take-filename", (event) => {
  const folderPath = getCurrentSceneFolder();
  const baseName = global.currentFolder || "Scene";
  const files = fs.readdirSync(folderPath);

  const existingTakes = files
    .filter(file => file.endsWith(".csv"))
    .map(file => {
      const match = file.match(new RegExp(`^${baseName} Take (\\d+)\\.csv$`));
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(n => n !== null);

  let nextTake = 1;
  while (existingTakes.includes(nextTake)) {
    nextTake++;
  }

  const newFileName = `${baseName} Take ${nextTake}.csv`;
  event.returnValue = newFileName;
});


ipcMain.on("get-recording-path", (event) => {
  event.returnValue = getRecordingFolder();
});


ipcMain.on("read-csv-content", (event, fileName) => {
  const sceneFolder = getCurrentSceneFolder();
  const filePath = path.join(sceneFolder, fileName);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    event.returnValue = content;
  } catch (err) {
    console.error("Failed to read CSV:", err);
    event.returnValue = null;
  }
});