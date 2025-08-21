const openDirectory = async (mode = "read") => {
  // Feature detection. The API needs to be supported
  // and the app not run in an iframe.


 
  let directoryStructure = undefined;

  // Recursive function that walks the directory structure.
  const getFiles = async (dirHandle, path = dirHandle.name) => {
    const dirs = [];
    const files = [];
    for await (const entry of dirHandle.values()) {
      const nestedPath = `${path}/${entry.name}`;
      if (entry.kind === "file") {
        if (getExtension(entry.name) == "indd" && getFileName(entry.name).toLowerCase().indexOf("all") != -1) {
          files.push(
              entry.getFile().then((file) => {
                file.directoryHandle = dirHandle;
                file.handle = entry;
                return Object.defineProperty(file, "webkitRelativePath", {
                  configurable: true,
                  enumerable: true,
                  get: () => nestedPath,
                });
              })
            );
        }
      } else if (entry.kind === "directory") {
        dirs.push(getFiles(entry, nestedPath));
      }
    }
    return [
      ...(await Promise.all(dirs)).flat(),
      ...(await Promise.all(files)),
    ];
  };

  try {
    // Open the directory.
    const handle = await showDirectoryPicker({
      mode,
    });
    // Get the directory structure.
    $("#loadingSpinner").show();
    $("#confirm").prop("disabled", true);
    $("#selectDirectoryBtn").prop("disabled", true);
    directoryStructure = await getFiles(handle, undefined);

    $("#loadingSpinner").hide();
    $("#confirm").prop("disabled", false);
    $("#selectDirectoryBtn").prop("disabled", false);
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err.name, err.message);
    }
  }
  return directoryStructure;
  
};

let selectFiles = []


$("#selectDirectoryBtn").on("click", async () => {
  const files = await openDirectory();

  displayFile(files);

  selectFiles = files
  $("#fileSelectTitle").text(`ไฟล์ที่เลือก : ${selectFiles.length} ไฟล์`);
});

$("#folderSelector").on("change", async e => {
  $("#loadingSpinner").show();
  $("#confirm").prop("disabled", true);

  const dt = new DataTransfer();

  for (file of e.target.files) {
    if (getExtension(file.name) == "indd" && getFileName(file.name).toLowerCase().indexOf("all") != -1) {
      dt.items.add(file);
    }
  }

  e.target.files = dt.files;
  displayFile(e.target.files);

  $("#loadingSpinner").hide();
  $("#confirm").prop("disabled", false);
});

var buildTable = (name, files) => {
  if (files.length == 0) return "";

  resultHtml = "";
  for (file of files) {
    resultHtml += `<tr><td>${file}</td></tr>`;
  }
  html = "<div class='row mx-1 my-2'><h2 class='text-center bg-danger'>" + name + "</h2><div><table class='table'><thead><tr class='bg-warning'><th>ไฟล์</th></tr></thead><tbody id='resultDisplay'>" + resultHtml + "</tbody></table></div>";
  return html;
};

$("#confirm").on("click", async e => {
  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

  $("#loadingSpinner").show();
  $("#confirm").prop("disabled", true);
  $("#selectDirectoryBtn").prop("disabled", true);
  $("#folderSelector").prop("disabled", true);

  if (confirm(`ต้องการ Export Image หรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    files.sort();

    fileChunks = [];
    const chunkSize = 30;
    for (let i = 0; i < files.length; i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }


    let outputPath = await (new Promise((resolve, reject) => {
      jsx.evalScript("selectFolderFromDialog()", output => {
        resolve(output)
      })
    }));
    
   
    var i = 0;
    console.log("start");

    for (let chunks of fileChunks) {
      console.log("start chunks", i++);
      await (new Promise((resolve, reject) => {
        jsx.evalScript(`startExportImageAllCatalog(${JSON.stringify(chunks)}, ${outputPath} )`, res => {
          console.log("result :", res);
          resolve(res)
        });
      }));
    }
    console.log("end chuck");

    $("#loadingSpinner").hide();
    $("#confirm").prop("disabled", false);
    $("#selectDirectoryBtn").prop("disabled", false);
    $("#folderSelector").prop("disabled", false);

  }
});
