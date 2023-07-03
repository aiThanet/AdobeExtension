$("#folderSelector").on("change", e => {
  const dt = new DataTransfer();

  for (file of e.target.files) {
    if (getExtension(file.name) == "indd") {
      dt.items.add(file);
    }
  }

  e.target.files = dt.files;
  displayFile(e.target.files);
});

$("#confirm").on("click", e => {
  var findFolder = $("#findFolder").val();
  findFolder = findFolder.replaceAll("\\", "\\\\");
  if (confirm(`ต้องการค้นหาลิงค์หรือไม่`)) {
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    jsx.evalScript(`startFindLink(${JSON.stringify(files)}, "${findFolder}")`, res => {
      data = JSON.parse(res);
      $("#displayBody").empty();
      $("#displayBody")[0].innerHTML = "<div class='row mx-1 my-2'><h2 class='text-center'>ผลลัพธ์</h2><div><table class='table'><thead><tr><th>ไฟล์</th></tr></thead><tbody id='resultDisplay'></tbody></table></div>";

      resultHtml = "";
      for (k in data) {
        if (data[k].length != 0) {
          resultHtml += `<tr><td class='text-center bg-danger'>${k}</td></tr>`;
          for (link of data[k]) {
            resultHtml += `<tr><td>${link}</td></tr>`;
          }
        }
      }
      $("#resultDisplay")[0].innerHTML = resultHtml;
    });
  }
});

$("input.txt-uppercase").on("keyup", e => {
  e.target.value = e.target.value.toUpperCase();
});
