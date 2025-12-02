$("#folderSelector").on("change", e => {
  const dt = new DataTransfer();

  for (file of e.target.files) {
    if(file.path.toLowerCase().indexOf("[skip]") != -1 || getFileName(file.name).toLowerCase().indexOf("[skip]") != -1) {
      continue;
    }
    
    if (getExtension(file.name) == "ai" && getFileName(file.name).toLowerCase().indexOf("[book]") != -1) {
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

$("#confirm").on("click", e => {
  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

  if (confirm(`ต้องการ Export PDF หรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    files.sort()
    jsx.evalScript(`startExportPDFillustrator(${JSON.stringify(files)})`, res => {
      console.log(res);
      data = JSON.parse(res);

      $("#displayBody").empty();

      var html = buildTable('ไฟล์ Export ไม่เสร็จ : ชื่อซ้ำ', data);

      $("#displayBody")[0].innerHTML = html;
    });
    return;
  }
});
