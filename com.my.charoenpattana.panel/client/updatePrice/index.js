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

var buildTablePrice = (name, files) => {
  if (files.length == 0) return "";

  resultHtml = "";
  for (file of files) {
    resultHtml += `<tr><td>${file[0]}</td><td>${file[1]}</td><td>${file[2]}</td></tr>`;
  }
  html = "<div class='row mx-1 my-2'><h2 class='text-center bg-primary'>" + name + "</h2><div><table class='table'><thead><tr class='bg-warning'><th>ไฟล์</th><th>ราคาเก่า</th><th>ราคาใหม่</th></tr></thead><tbody id='resultDisplay'>" + resultHtml + "</tbody></table></div>";
  return html;
};

var priceList = {
  "HG260-07": 199,
  "HG260-08": 60,
}; // TODO: call price api

$("#confirm").on("click", e => {
  if ($("#folderSelector")[0].files.length < 1) {
    alert("โปรดเลือกไฟล์");
    return;
  }

  if (confirm(`ต้องการอัพเดตราคาหรือไม่`)) {
    $("#confirm").prop("disabled", true);
    var files = Array.from($("#folderSelector")[0].files).map(f => f.path);
    $.ajax({
      url: "http://mathongapi.jpn.local/price/first",
      success: rawPriceList => {
        priceList = JSON.parse(rawPriceList);
        jsx.evalScript(`startUpdatePrice(${JSON.stringify(files)}, ${JSON.stringify(priceList)})`, res => {
          console.log(res);
          data = JSON.parse(res);

          $("#displayBody").empty();

          var html = "";

          html += buildTable("รหัสสินค้าไม่ตรง", data.NotFoundPrice);
          html += buildTablePrice("รหัสสินค้าที่อัพเดต", data.UpdatedPrice);
          html += buildTablePrice("รหัสสินค้าที่ไม่เปลี่ยนแปลง", data.NotUpdatePrice);

          $("#displayBody")[0].innerHTML = html;
        });
      },
      error: err => {
        alert("ลองใหม่อีกครั้ง: " + err.statusText);
      },
      timeout: 30000,
    });
    return;
  }
});
