$("#folderSelector").on("change", e => {
  const dt = new DataTransfer();

  for (file of e.target.files) {
    if(file.path.toLowerCase().indexOf("[skip]") != -1 || getFileName(file.name).toLowerCase().indexOf("[skip]") != -1) {
      continue;
    }
    
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

var buildTablePrice = (name, files) => {
  if (files.length == 0) return "";

  resultHtml = "";
  for (file of files) {
    resultHtml += `<tr><td>${file[0]}</td><td>${file[1]}</td><td>${file[2]}</td></tr>`;
  }
  html = "<div class='row mx-1 my-2'><h2 class='text-center bg-primary'>" + name + "</h2><div><table class='table'><thead><tr class='bg-warning'><th>ไฟล์</th><th>ราคาเก่า</th><th>ราคาใหม่</th></tr></thead><tbody id='resultDisplay'>" + resultHtml + "</tbody></table></div>";
  return html;
};

$("#confirm").on("click", async e => {
  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

  if (confirm(`ต้องการอัพเดตราคาหรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    files.sort();

    fileChunks = [];
    const chunkSize = 50;
    for (let i = 0; i < files.length; i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }

    var priceList = await $.ajax({
      url: "http://mathongapi.jpn.local/price/first",
      error: err => {
        alert("ลองใหม่อีกครั้ง: " + err.statusText);
      },
      timeout: 30000,
    });

    var i = 0;
    console.log("start");

    $("#displayBody").empty();

    var html = "";

    var resData = {
      'MissingFont' : [],
      'NotFoundPrice' : [],
      'UpdatedPrice' : [],
      'NotUpdatePrice' : []
    }

    for (let chunks of fileChunks) {
      console.log("start chunks", i++);
      await (new Promise((resolve, reject) => {
        jsx.evalScript(`startUpdatePrice(${JSON.stringify(chunks)}, ${JSON.stringify(priceList)})`, res => {
          console.log("result :", res);
          data = JSON.parse(res);

          resData['NotFoundPrice'] = [...resData['NotFoundPrice'], ...data.NotFoundPrice]
          resData['UpdatedPrice'] = [...resData['UpdatedPrice'], ...data.UpdatedPrice]
          resData['NotUpdatePrice'] = [...resData['NotUpdatePrice'], ...data.NotUpdatePrice]
          resData['MissingFont'] = [...resData['MissingFont'], ...data.MissingFont]

          resolve(res)
        });
      }));
    }
    console.log("end chuck");

    html += buildTable("ฟอนต์หาย", resData['MissingFont']);
    html += buildTable("รหัสสินค้าไม่ตรง", resData['NotFoundPrice']);
    html += buildTablePrice("รหัสสินค้าที่อัพเดต", resData['UpdatedPrice']);
    html += buildTablePrice("รหัสสินค้าที่ไม่เปลี่ยนแปลง", resData['NotUpdatePrice']);
    
    $("#displayBody")[0].innerHTML = html;

  }
});
