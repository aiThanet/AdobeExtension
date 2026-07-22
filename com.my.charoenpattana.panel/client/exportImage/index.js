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
      if (getExtension(file.name) == "indd" && getFileName(file.name).toLowerCase().indexOf("all") == -1) {
        dt.items.add(file);
      }
    }

    target.files = dt.files;
    displayFile(target.files);

    status.html('<span class="text-success">เลือกไฟล์ .indd จำนวน ' + target.files.length + ' ไฟล์</span>');
  } catch (err) {
    console.error(err);
    status.html('<span class="text-danger">เกิดข้อผิดพลาด: ' + err.message + '</span>');
  } finally {
    $("#confirm").prop("disabled", false);
  }
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
  // var withPrice = $("#withPriceCheckbox").prop("checked");

  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

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

    let outputPath = await (new Promise((resolve, reject) => {
      jsx.evalScript("selectFolder_JPNDESIGN_IMAGE()", output => {
        resolve(output)
      })
    }));

    var i = 0;
    console.log("start");

    for (let chunks of fileChunks) {
      console.log("start chunks", i++);
      await (new Promise((resolve, reject) => {
        jsx.evalScript(`startExportImage(${JSON.stringify(chunks)}, ${JSON.stringify(lastModified)}, ${outputPath})`, res => {
          console.log("result :", res);
          resolve(res)
        });
      }));
    }

    console.log("start trim");
    await (new Promise((resolve, reject) => {
      jsx.evalScript("runTrimScript()", res => {
        console.log("Trim ", res)
        resolve(res)
      })
    }));

    console.log("end trim");
  }
});
