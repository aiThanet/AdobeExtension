function startMoveAllLink(files) {
  var file = files[0];
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  var missingLink = moveLink(file);
  var f = File(file);
  fileName = f.getFileNameWithExtension();
  f.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return JSON.lave(missingLink);
}

function startChangeName(files, srcName, destName) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;

  var missing = {};
  for (var i = 0; i < files.length; i++) {
    var res = changeName(files[i], srcName, destName, 1);
    var file = File(files[i]);
    fileName = file.getFileNameWithExtension();
    missing[fileName] = res[0];
    file.close();
  }
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return JSON.lave(missing);
}

function startFindLink(files, folderDest) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  var missing = {};
  for (var i = 0; i < files.length; i++) {
    var missingLink = findLink(files[i], folderDest);
    var file = File(files[i]);
    fileName = file.getFileNameWithExtension();
    missing[fileName] = missingLink;
    file.close();
  }
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;

  return JSON.lave(missing);
}

function startUpdatePrice(files, priceList) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  var result = {
    NotFoundPrice: [],
    UpdatedPrice: [],
    NotUpdatePrice: [],
  };
  progress(files.length);

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileName();

    // since filename can't use slash we will 'underscore' instead
    fileName = fileName.replace("_", "/");
    progress.message(i + 1 + " / " + files.length + " : " + fileName);
    // temporary fix rename from HG to V mismatch between catalog and system
    var tempName = fileName.replace("HG", "V");
    var tempName2 = fileName.replace("HG", "IG");
    var tempName3 = fileName.replace("HG-", "");

    var priceNotFound = false;
    var newPrice = 0;
    if (fileName in priceList) {
      newPrice = parseFloat(priceList[fileName]["price"]); //temporary fix rename from HG to V mismatch between catalog and system
    } else if (tempName in priceList) {
      newPrice = parseFloat(priceList[tempName]["price"]); //temporary fix rename from HG to V mismatch between catalog and system
    } else if (tempName2 in priceList) {
      newPrice = parseFloat(priceList[tempName2]["price"]); //temporary fix rename from HG to V mismatch between catalog and system
    } else if (tempName3 in priceList) {
      newPrice = parseFloat(priceList[tempName3]["price"]); //temporary fix rename from HG to V mismatch between catalog and system
    } else {
      result.NotFoundPrice.push(fileName);
      priceNotFound = true;
    }
    if (!priceNotFound) {
      var oldPrice = updatePrice(files[i], newPrice);
      var row = [fileName, oldPrice, newPrice];
      if (oldPrice == newPrice) {
        result.NotUpdatePrice.push(row);
      } else {
        result.UpdatedPrice.push(row);
      }
    }
    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return JSON.lave(result);
}

function startExportPDF(files) {
  var outputFolder = Folder.selectDialog("Select output folder");
  var outputPathPath = outputFolder.fsName;
  var notSavingFiles = [];
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  progress(files.length);

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileName();

    progress.message(i + 1 + " / " + files.length + " : " + fileName);
    var notSavingFile = exportPDF(file, outputPathPath);
    if (notSavingFile) notSavingFiles.push(notSavingFile);

    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return JSON.lave(notSavingFiles);
}

function startExportImageAllCatalog(files, outputPath) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  progress(files.length);

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileName();

    progress.message(i + 1 + " / " + files.length + " : " + fileName);
    exportImageAllCatalog(file, outputPath);

    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return "";
}

function startMoveItem(goodCode) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  moveAfterItem(goodCode);
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
}

function startFixBleed(files) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  progress(files.length);

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileName();

    progress.message(i + 1 + " / " + files.length + " : " + fileName);
    fixBleed(file);

    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;

  return "";
}

function runTrimScript() {
  var trim_res = File("\\\\JPNNAS\\jpndesign\\images\\trim.py").execute();
  var optimize_res = "None"
  // var optimize_res = File("\\\\JPNNAS\\jpndesign\\images\\optimize.py").execute();
  // return JSON.lave("Result Trim: " + trim_res)
  return JSON.lave("Result Trim: " + trim_res + " Result Optimize: " + optimize_res);
}

function startExportImage(files, lastModified, outputPath) {
  var notSavingFiles = [];
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  progress(files.length);

  var backupPath = outputPath + "/backup";
    backupPathPriceFolder = Folder(backupPath);
    if (!backupPathPriceFolder.exists) {
      backupPathPriceFolder.create();
    }

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileName();

    progress.message(i + 1 + " / " + files.length + " : " + fileName);

    var notSavingFile = exportImage(file, outputPath, backupPath, lastModified[files[i]], "withPrice", 600);
    exportImage(file, outputPath, backupPath, lastModified[files[i]], "withoutPrice", 600);
    exportImage(file, outputPath, backupPath, lastModified[files[i]], "withoutDescription", 600);
    exportImage(file, outputPath, backupPath, lastModified[files[i]], "withOnlyImage", 600);
    exportImage(file, outputPath, backupPath, lastModified[files[i]], "withoutPricePNG", 600);

    if (notSavingFile) notSavingFiles.push(file.getFileNameWithExtension());

    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;

  var now = Date.now();
  var rows = [];

  for (var i = 0; i < files.length; i++) {
    var file = File(files[i]);
    var fileName = file.getFileNameWithExtension();
    var row = [fileName, lastModified[files[i]], now, notSavingFiles.indexOf(fileName) == -1 ? "สำเร็จ" : "ไม่สำเร็จ"];
    rows.push(row.join(","));
    file.close();
  }

  var csvContent = rows.join("\n") + "\n";

  var resultFile = new File(outputPath + "/result.csv");
  resultFile.encoding = "utf-8";
  resultFile.open("a");
  resultFile.write(csvContent);
  resultFile.close();

  return JSON.lave(notSavingFiles);
}

function selectFolder_JPNDESIGN_IMAGE() {
  // var folder = Folder.selectDialog("Select folder");
  var folder = Folder("\\\\JPNNAS\\jpndesign\\images");
  return JSON.lave(folder.fsName);
}

function selectFolderFromDialog() {
  var folder = Folder.selectDialog("Select folder");
  return JSON.lave(folder.fsName);
}
