const INTERVALO = 2000; //em milisegundos

setInterval(() => {
  const csvFiles = window.electron.sendSync("get-csv-files");
  addFiles(csvFiles ?? []);
}, INTERVALO);

function addFiles(csvFiles) {
  const fileListElement = document.getElementById("filelist");
  const checkeds = [];
  document.querySelectorAll(`.file-checkbox[type="checkbox"]`).forEach(fileEl => {
    if(fileEl.checked) 
        checkeds.push(fileEl.value);
  })
  fileListElement.innerHTML = ""; //Todo - limpando, por enquanto, tudo
  csvFiles.sort((a, b) => a < b);
  csvFiles.forEach((file) => {
    const isChecked = checkeds.includes(file) 
    const listItem = document.createElement("tr");
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
            <p class="text-muted">September 20, 2023</p> 
            <!-- You might want to adjust this hardcoded date -->
        </td>
        <td class="td-actions text-right">
            <button type="button" rel="tooltip" title="" class="btn btn-link" data-original-title="Edit Task">
                <i class="tim-icons icon-pencil"></i>
            </button>
        </td>
    `;
    if(isChecked)
        listItem.querySelector(`.file-checkbox[type="checkbox"]`).checked = true;
    fileListElement.appendChild(listItem);
  });
}
