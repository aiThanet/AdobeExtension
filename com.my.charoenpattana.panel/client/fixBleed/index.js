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
  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

  if (confirm(`ต้องการ Fix Bleed หรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    files.sort();
    jsx.evalScript(`startFixBleed(${JSON.stringify(files)})`, res => {
      console.log(res);
    });
    return;
  }
});
