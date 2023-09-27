const { ipcRenderer } = require('electron').ipcRenderer;
const path = require('path');

// Create a path relative to the root directory of your Electron application
const relativePath = './files'; 
const absolutePath = path.join(__dirname, relativePath); 


const csvFiles = window.electron.sendSync('get-csv-files', absolutePath);
console.log('Directory Path:', absolutePath);
console.log("Received CSV files:", csvFiles);
const fileListElement = document.getElementById('filelist');

csvFiles.forEach(file => {
    const listItem = document.createElement('tr');
    listItem.innerHTML = `
        <td>
            <div class="form-check">
                <label class="form-check-label">
                    <input class="form-check-input" type="checkbox" value="">
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
    fileListElement.appendChild(listItem);
});
