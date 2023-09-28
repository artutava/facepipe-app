const INTERVALO = 1000; //em milisegundos
let currentFolder = null;
setInterval(() => {
  if(!currentFolder) setCurrentFolder('Scene 1')
  else addFolders(getFolders());
  addFiles(getFiles(currentFolder));
}, INTERVALO);

function createFolder() {}
function getFolders() {
  return window.electron.sendSync("get-folders", currentFolder) || [];
}
function getFiles() {
  return window.electron.sendSync("get-csv-files") || [];
}

function createFolder() {
  return window.electron.sendSync("create-folder");
}

function setCurrentFolder(folder) {
  currentFolder = folder;
  window.electron.sendSync("set-current-folder", folder);
  addFolders(getFolders());
}

function deleteItems() {
  const checkedFolders = [];
  document
    .querySelectorAll(`.folder-checkbox[type="checkbox"]`)
    .forEach((folderEl) => {
      if (folderEl.checked) checkedFolders.push(folderEl.value);
    });
  if(checkedFolders.length){
    if(checkedFolders.includes(currentFolder)) setCurrentFolder(null);
    window.electron.sendSync("delete-folders", checkedFolders);
    return;
  }

  
  const checkedFiles = [];
  document
    .querySelectorAll(`.file-checkbox[type="checkbox"]`)
    .forEach((folderEl) => {
      if (folderEl.checked) checkedFiles.push(folderEl.value);
    });
  if(checkedFiles.length){
    window.electron.sendSync("delete-files", checkedFiles);
  }


}

function addFiles(csvFiles) {
  const fileListElement = document.getElementById("filelist");
  const checkeds = [];
  document
    .querySelectorAll(`.file-checkbox[type="checkbox"]`)
    .forEach((fileEl) => {
      if (fileEl.checked) checkeds.push(fileEl.value);
    });
  fileListElement.innerHTML = ""; //Todo - limpando, por enquanto, tudo
  csvFiles.sort((a, b) => a < b);
  csvFiles.forEach((file) => {
    const isChecked = checkeds.includes(file);
    const listItem = document.createElement("tr");
    const dateFile = new Date(window.electron.sendSync("get-date-file", file));
    const dateString = dateFile.toLocaleDateString('en-US') + " " + `${dateFile.getHours()}:${dateFile.getMinutes()}`;
    listItem.dataset.filename = file;
    listItem.innerHTML = `
        <td>
            <div class="form-check">
                <label class="form-check-label">
                    <input class="form-check-input file-checkbox" value="${file}"  type="checkbox">
                    <span class="form-check-sign">
                        <span class="check"></span>
                    </span>
                </label>
            </div>
        </td>
        <td>
            <p class="title"> <i class="fa-solid fa-file"></i>${file}</p>
            <p class="text-muted">${dateString}</p> 
            <!-- You might want to adjust this hardcoded date -->
        </td>
        <td class="td-actions text-right">
            <button type="button" rel="tooltip" title="" class="btn btn-link" data-original-title="Edit Task">
                <i class="tim-icons icon-pencil"></i>
            </button>
        </td>
    `;
    if (isChecked)
      listItem.querySelector(`.file-checkbox[type="checkbox"]`).checked = true;
    fileListElement.appendChild(listItem);
  });
}

function addFolders(folders) {
  const folderListElement = document.getElementById("folders-list");
  const checkeds = [];
  document
    .querySelectorAll(`.folder-checkbox[type="checkbox"]`)
    .forEach((folderEl) => {
      if (folderEl.checked) checkeds.push(folderEl.value);
    });
  folderListElement.innerHTML = "";
  folders.sort((a, b) => a < b);
  folders.forEach((folder) => {
    const isChecked = checkeds.includes(folder);
    const listItem = document.createElement("tr");
    if(currentFolder === folder)
      listItem.classList.add("tr-selected");
    listItem.classList.add("tr-folder");
    listItem.dataset.foldername = folder;
    listItem.innerHTML = `
        <td class="icon-td" onclick="setCurrentFolder('${folder}')">
            <i class="fa-solid fa-folder"></i>
        </td>
        <td onclick="setCurrentFolder('${folder}')">
            <p class="title">${folder}</p>            
        </td>
        <td class="td-actions text-right">
            <div class="form-check">
                <label class="form-check-label">
                    <input class="form-check-input folder-checkbox" value="${folder}" type="checkbox">
                    <span class="form-check-sign">
                        <span class="check"></span>
                    </span>
                </label>
            </div>
        </td>
      `;
    if (isChecked)
      listItem.querySelector(
        `.folder-checkbox[type="checkbox"]`
      ).checked = true;
    folderListElement.appendChild(listItem);
  });
}
