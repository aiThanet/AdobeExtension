$("#folderSelector").on("change", e => {
  const dt = new DataTransfer();

  for (file of e.target.files) {
    if (getExtension(file.name) == "indd" && getFileName(file.name).toLowerCase().indexOf("all") == -1) {
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

  // var historySelectorPath = "";

  // if ($("#historySelector")[0].files.length > 0) {
  //   historySelectorPath = $("#historySelector")[0].files[0].path;
  // }

  if (confirm(`ต้องการ Export Image หรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var lastModified = {};
    var files = [];
    Array.from($("#folderSelector")[0].files).forEach(f => {
      lastModified[f.path] = f.lastModified;
      files.push(f.path);
    });

    files.sort();

    fileChunks = [];
    const chunkSize = 50;
    for (let i = 0; i < files.length; i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }

    jsx.evalScript("selectFolder()", output => {
      var i = 0;

      fileChunks.forEach(async chunks => {
        console.log("start chunks", i++);
        await jsx.evalScript(`startExportImage(${JSON.stringify(chunks)}, ${JSON.stringify(lastModified)}, ${output})`, res => {
          console.log("result :", res);
          // data = JSON.parse(res);

          // $("#displayBody").empty();
          // var html = buildTable("ไฟล์ Export ไม่เสร็จ : ชื่อซ้ำ, ไฟล์อัพเดตอยู่แล้ว", data);
          // $("#displayBody")[0].innerHTML = html;
        });
      });

      console.log("end");
    });
  }
});
