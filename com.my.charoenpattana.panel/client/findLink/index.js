jsx.file("utils.jsx");
jsx.file("json.jsx");
jsx.file("index.jsx");

$("#restartExt").on("click", function () {
  try {
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // if we're restarting then we should remove all the eventListeners so we don't get double events //
    // Try get the point over                                                                         //
    // CRITICAL MAKE SURE TO CLOSE NULLIFY ETC. ANY LOOSE WATCHERS, EVENTLISTENERS, GLOBALS ETC.      //
    // CRITICAL MAKE SURE TO CLOSE NULLIFY ETC. ANY LOOSE WATCHERS, EVENTLISTENERS, GLOBALS ETC.      //
    // CRITICAL MAKE SURE TO CLOSE NULLIFY ETC. ANY LOOSE WATCHERS, EVENTLISTENERS, GLOBALS ETC.      //
    // CRITICAL MAKE SURE TO CLOSE NULLIFY ETC. ANY LOOSE WATCHERS, EVENTLISTENERS, GLOBALS ETC.      //
    // for example watcher.close();                                                                   //
    // Then reset the UI to load it's page (if it hasn't change page)                                 //
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    process.removeAllListeners();
    window.location.href = "index.html";
  } catch (e) {
    window.location.href = "index.html";
  }
});

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

var displayFile = files => {
  var output = $("#fileDisplay");
  output.empty();

  for (var i = 0; i < files.length; i++) {
    var table_row = document.createElement("tr");
    var button_column = document.createElement("td");
    var file_column = document.createElement("td");
    file_column.innerHTML = files[i].name;
    button_column.innerHTML = '<button type="button" class="btn-close" aria-label="Close" id="item-' + i + '"></button>';
    table_row.append(button_column);
    table_row.append(file_column);
    output.append(table_row);
  }

  $("button.btn-close").on("click", e => {
    var idx = e.target.id.split("-")[1];
    deleteFileByIdx(idx);
  });
};

var deleteFileByIdx = idx => {
  const dt = new DataTransfer();
  var selector = $("#folderSelector")[0];
  var files = selector.files;
  for (var i = 0; i < files.length; i++) {
    if (i != idx) {
      dt.items.add(files[i]);
    }
  }

  selector.files = dt.files;
  displayFile(selector.files);
};

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
