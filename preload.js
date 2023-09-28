const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electron', {
      sendSync: ipcRenderer.sendSync
  }
);

// Cria pasta Facepipe e Lista os Arquivos
// setInterval(() => window['files'] = ipcRenderer.sendSync('get-csv-files'), 1000)

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })
  
  window.onerror = (message, source, lineno, colno, error) => {
    console.error(`An error occurred: ${message} at ${source}:${lineno}:${colno}`, error);
};
