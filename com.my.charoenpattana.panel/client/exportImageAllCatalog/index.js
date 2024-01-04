$("#folderSelector").on("change", e => {
  const dt = new DataTransfer();

  for (file of e.target.files) {
    if (getExtension(file.name) == "indd" && getFileName(file.name).toLowerCase().indexOf("all") != -1) {
      dt.items.add(file);
    }
  }

  e.target.files = dt.files;
  displayFile(e.target.files);
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

  }
});
