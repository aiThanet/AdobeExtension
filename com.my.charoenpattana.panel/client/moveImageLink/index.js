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
      if (getExtension(file.name) == "indd") {
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
  if ($("#folderSelector")[0].files.length != 1) {
    console.log("over 1 file");
    alert("โปรดเลือกแค่ 1 ไฟล์เท่านั้น");
    return;
  }
  if (confirm("ต้องการเริ่มดำเนินการหรือไม่")) {
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    jsx.evalScript(`startMoveAllLink(${JSON.stringify(files)})`, res => {
      console.log(res);
      data = JSON.parse(res);
      missing = data[0];
      notUsedFiles = data[1];

      $("#displayBody").empty();
      $("#displayBody")[0].innerHTML = "<div class='row mx-1 my-2'><h2 class='text-center'>ไฟล์ที่มีลิงค์หาย</h2><div><table class='table'><thead><tr><th>ไฟล์</th></tr></thead><tbody id='resultDisplay'></tbody></table></div>";
      resultHtml = "";

      for (k in missing) {
        if (missing[k].length != 0) {
          resultHtml += `<tr><td class='text-center bg-danger'>${k}</td></tr>`;
          for (link of missing[k]) {
            resultHtml += `<tr><td>${link}</td></tr>`;
          }
        }
      }

      $("#resultDisplay")[0].innerHTML = resultHtml;

      $("#displayBody2").empty();
      $("#displayBody2")[0].innerHTML = "<div class='row mx-1 my-2'><h2 class='text-center'>ไฟล์ที่ไม่ได้ใช้งาน</h2><div><table class='table'><thead><tr><th>ไฟล์</th></tr></thead><tbody id='resultDisplay2'></tbody></table></div>";

      resultHtml = "";
      for (k of notUsedFiles) {
        resultHtml += `<tr><td>${k}</td></tr>`;
      }

      $("#resultDisplay2")[0].innerHTML = resultHtml;
    });
  }
});
