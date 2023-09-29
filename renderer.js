const INTERVALO = 1000; //em milisegundos
let currentFolder = null;
let currentEditFolder = null;

setInterval(() => {
  if (!currentFolder) setCurrentFolder("Scene 1");
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
  document.querySelectorAll(".tr-folder").forEach(folderEl => {
    if(folderEl.dataset.foldername === folder) folderEl.classList.add("tr-selected");
    else folderEl.classList.remove("tr-selected");
  })

}

function openExplorer() {
  window.electron.sendSync("open-explorer");
}

function onBlurEditFolder(newValue, folderName) {
  const folderElement = document.querySelector(`[data-folder="${folderName}"]`);
  if(newValue !== folderName)
    window.electron.sendSync("rename-folder", newValue, folderName)
  if(currentFolder === folderName) setCurrentFolder(newValue);
  if (folderElement && newValue === folderName) {
    const paragraphElement = document.createElement("p");
    paragraphElement.className = "title";
    paragraphElement.textContent = newValue;

    paragraphElement.addEventListener("dblclick", function (event) {
      setCurrentEditFolder(newValue);
    });
    folderElement.innerHTML = "";
    folderElement.prepend(paragraphElement);
  }
}

function setCurrentEditFolder(folderName) {
  const folderElement = document.querySelector(`[data-folder="${folderName}"]`);

  if (folderElement) {
    const inputElement = document.createElement("input");
    inputElement.className = "form-input folder-checkbox";
    inputElement.value = folderName;

    inputElement.addEventListener('keyup', function(event) {
      if (event.key === 'Escape' || event.key === 'Esc'|| event.key === 'Return') {
        onBlurEditFolder(event.target.value, folderName);
      }
    });
    inputElement.addEventListener("blur", function (event) {
      onBlurEditFolder(event.target.value, folderName);
    });

    folderElement.innerHTML = "";
    folderElement.prepend(inputElement);
    inputElement.focus();
  }
}


function onBlurEditFile(newValue, fileName) {
  if(!newValue.endsWith('.csv')) newValue += '.csv';
  const fileElement = document.querySelector(`[data-file="${fileName}"]`);
  if(newValue !== fileName)
    window.electron.sendSync("rename-file", newValue, fileName)
  if (fileElement && newValue === fileName) {
    const paragraphElement = document.createElement("p");
    paragraphElement.className = "title";
    paragraphElement.textContent = newValue;
    paragraphElement.addEventListener("dblclick", function (event) {
      setCurrentEditFile(newValue);
    });
    fileElement.innerHTML = "";
    fileElement.prepend(paragraphElement);
  }
}

function setCurrentEditFile(fileName) {
  const fileElement = document.querySelector(`[data-file="${fileName}"]`);

  if (fileElement) {
    const inputElement = document.createElement("input");
    inputElement.className = "form-input file-checkbox";
    inputElement.value = fileName;

    inputElement.addEventListener('keyup', function(event) {
      if (event.key === 'Escape' || event.key === 'Esc' || event.key === 'Return') {
        setCurrentEditFile(newValue);
      }
    });
    inputElement.addEventListener("blur", function (event) {
      onBlurEditFile(event.target.value, fileName);
    });

    fileElement.innerHTML = "";
    fileElement.prepend(inputElement);
    inputElement.focus();
  }
}

function deleteItems() {
  const checkedFolders = [];
  document
    .querySelectorAll(`.folder-checkbox[type="checkbox"]`)
    .forEach((folderEl) => {
      if (folderEl.checked) checkedFolders.push(folderEl.value);
    });
  if (checkedFolders.length) {
    if (checkedFolders.includes(currentFolder)) setCurrentFolder(null);
    window.electron.sendSync("delete-folders", checkedFolders);
    return;
  }

  const checkedFiles = [];
  document
    .querySelectorAll(`.file-checkbox[type="checkbox"]`)
    .forEach((folderEl) => {
      if (folderEl.checked) checkedFiles.push(folderEl.value);
    });
  if (checkedFiles.length) {
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

  // Obter a lista atual de pastas exibidas na página
  const currentFiles = Array.from(
    fileListElement.querySelectorAll(".tr-file")
  ).map((item) => item.dataset.filename);

  // Remover pastas que não estão na lista atualizada
  currentFiles.forEach((currentFile) => {
    if (!csvFiles.includes(currentFile)) {
      const itemToRemove = fileListElement.querySelector(
        `.tr-file[data-filename="${currentFile}"]`
      );
      if (itemToRemove) {
        fileListElement.removeChild(itemToRemove);
      }
    }
  });

  csvFiles.sort((a, b) => a > b);
  csvFiles.forEach((file) => {
    if (!currentFiles.includes(file)) {
      const isChecked = checkeds.includes(file);
      const listItem = document.createElement("tr");
      listItem.classList.add("tr-file");
      const dateFile = new Date(
        window.electron.sendSync("get-date-file", file)
      );
      const dateString =
        dateFile.toLocaleDateString("en-US") + " " + `${formatHour(dateFile)}`;
      listItem.dataset.filename = file;
      listItem.innerHTML = `
            <td class="icon-td">
                <div class="form-check">
                    <label class="form-check-label">
                        <input class="form-check-input file-checkbox" value="${file}"  type="checkbox">
                        <span class="form-check-sign">
                            <span class="check"></span>
                        </span>
                    </label>
                </div>
            </td>
            <td class="icon-td">
            <i class="fa-solid fa-file"></i>
            </td>
            <td>
                <div  class="file-name" data-file="${file}">
                  <p class="title" ondblclick="setCurrentEditFile('${file}')">${file}</p>
                </div>
                <p class="text-muted">${dateString}</p> 
            </td>
            <td class="td-actions text-right">
                <button type="button" rel="tooltip" title="" class="btn btn-link" data-original-title="Edit Task" onclick="setCurrentEditFile('${file}')">
                    <i class="tim-icons icon-pencil"></i>
                </button>
            </td>
        `;
      if (isChecked)
        listItem.querySelector(
          `.file-checkbox[type="checkbox"]`
        ).checked = true;
      fileListElement.prepend(listItem);
    }
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

  // Obter a lista atual de pastas exibidas na página
  const currentFolders = Array.from(
    folderListElement.querySelectorAll(".tr-folder")
  ).map((item) => item.dataset.foldername);

  // Remover pastas que não estão na lista atualizada
  currentFolders.forEach((currentFolder) => {
    if (!folders.includes(currentFolder)) {
      const itemToRemove = folderListElement.querySelector(
        `.tr-folder[data-foldername="${currentFolder}"]`
      );
      if (itemToRemove) {
        folderListElement.removeChild(itemToRemove);
      }
    }
  });
  folders.sort((a, b) => a < b);
  folders.forEach((folder) => {
    if (!currentFolders.includes(folder)) {
      const isChecked = checkeds.includes(folder);
      const listItem = document.createElement("tr");
      if (currentFolder === folder) listItem.classList.add("tr-selected");
      listItem.classList.add("tr-folder");
      listItem.dataset.foldername = folder;
      listItem.innerHTML = `
    <td class="icon-td">
            <div class="form-check">
                <label class="form-check-label">
                    <input class="form-check-input folder-checkbox" value="${folder}" type="checkbox">
                    <span class="form-check-sign">
                        <span class="check"></span>
                    </span>
                </label>
            </div>
        </td>
        <td class="icon-td" onclick="setCurrentFolder('${folder}')">
            <i class="fa-solid fa-folder"></i>
        </td>
        <td onclick="setCurrentFolder('${folder}')" class="folder-name" data-folder="${folder}">
          <p  class="title" ondblclick="setCurrentEditFolder('${folder}')"> ${folder} </p>                        
        </td>
        <td class="td-actions text-right">
            <button type="button" rel="tooltip" title="" class="btn btn-link" data-original-title="Edit Task"  onclick="setCurrentEditFolder('${folder}')">
                <i class="tim-icons icon-pencil"></i>
            </button>
        </td>
        
      `;
      if (isChecked)
        listItem.querySelector(
          `.folder-checkbox[type="checkbox"]`
        ).checked = true;
      folderListElement.append(listItem);
    }
  });
}

function formatHour(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();

  let interval = hours >= 12 ? "PM" : "AM";

  if (hours > 12) hours -= 12;
  if (minutes < 10) minutes = "0" + minutes;
  const hourFormated = hours + ":" + minutes + " " + interval;
  return hourFormated;
}
