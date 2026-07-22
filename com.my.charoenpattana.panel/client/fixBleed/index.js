$("#folderSelector").on("change", async e => {
  const target = e.target;
  const status = $("#folderStatus");

  status.html('<div class="spinner-border text-primary" role="status"></div><span class="mx-2">กำลังโหลดไฟล์...</span>');
  $("#confirm").prop("disabled", true);

  // yield so the spinner paints before the (blocking) filter loop on large folders
  await new Promise(resolve => setTimeout(resolve, 0));

  try {
    const dt = new DataTransfer();

    for (const file of target.files) {
      if (getExtension(file.name) == "indd" && getFileName(file.name).toLowerCase().indexOf("all") != -1) {
        dt.items.add(file);
      }
    }

    target.files = dt.files;
    displayFile(target.files);

    status.html('<span class="text-success">เลือกไฟล์ จำนวน ' + target.files.length + ' ไฟล์</span>');
  } catch (err) {
    console.error(err);
    status.html('<span class="text-danger">เกิดข้อผิดพลาด: ' + err.message + '</span>');
  } finally {
    $("#confirm").prop("disabled", false);
  }
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