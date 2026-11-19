var getExtension = s => {
  return s.substring(s.lastIndexOf(".") + 1);
};

var getFileName = s => {
  return s.substring(s.lastIndexOf("\\") + 1, s.lastIndexOf("."));
};

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

// Host (JSX.js) errors come back as a plain string, e.g. "Error 21: ...\nLine: ..."
var isJsxError = res => res === "EvalScript error." || /^[A-Za-z]*Error[^:\n]*: /.test(res);

var runJsx = script =>
  new Promise((resolve, reject) => {
    jsx.evalScript(script, res => {
      if (isJsxError(res)) {
        alert("เกิดข้อผิดพลาด:\n" + res);
        var err = new Error(res);
        err.alerted = true;
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

window.onerror = (message, source, line, col, error) => {
  alert("เกิดข้อผิดพลาด:\n" + message + "\n" + source + ":" + line + "\n" + ((error && error.stack) || ""));
};

window.addEventListener("unhandledrejection", e => {
  var r = e.reason;
  if (r && r.alerted) return;
  alert("เกิดข้อผิดพลาด:\n" + ((r && (r.stack || r.message || r.statusText)) || r));
});
