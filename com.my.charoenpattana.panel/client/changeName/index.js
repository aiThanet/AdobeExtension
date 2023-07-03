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

$("#confirm").on("click", e => {
  if ($("#folderSelector")[0].files.length != 1) {
    console.log("over 1 file");
    alert("โปรดเลือกแค่ 1 ไฟล์เท่านั้น");
    return;
  }
  var srcName = $("#src-name").val();
  var destName = $("#dest-name").val();
  if (srcName == "" || destName == "") {
    alert("โปรดระบุ ชื่อตั้งต้น และ ชื่อที่ต้องการเปลี่ยน");
    return;
  }
  if (confirm(`ต้องการเปลี่ยนชื่อจาก "${srcName}" ไปเป็น "${destName}" หรือไม่`)) {
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    jsx.evalScript(`startChangeName(${JSON.stringify(files)}, "${srcName}", "${destName}")`, res => {
      console.log(res);
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
