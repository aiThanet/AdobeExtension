﻿Array.prototype.includes = function (obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
};

Array.prototype.indexOf = function (obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return i;
    }
  }
  return -1;
};

Array.prototype.indexOfMinimum = function () {
  var i = this.length;
  var min_val = 999999999;
  var min_idx = -1;
  while (i--) {
    if (this[i] < min_val) {
      min_val = this[i];
      min_idx = i;
    }
  }
  return min_idx;
};

/* Get full path of file */
File.prototype.getFullPath = function () {
  return this.fsName;
};

/* Get full path of the folder of the file */
File.prototype.getFolderPath = function () {
  var str = this.fsName;
  return str.substring(0, str.lastIndexOf("\\"));
};
/* Get file name */
File.prototype.getFileName = function () {
  var str = this.fsName;
  return str.substring(str.lastIndexOf("\\") + 1, str.lastIndexOf("."));
};

/* Get file extension */
File.prototype.getFileExtension = function () {
  var str = this.fsName;
  return str.substring(str.lastIndexOf(".") + 1);
};

File.prototype.getParentDirectoryName = function () {
  var str = this.getFolderPath();
  return str.substring(str.lastIndexOf("\\") + 1);
};

File.prototype.getFileNameWithExtension = function () {
  return this.getFileName() + "." + this.getFileExtension();
};

function createImageFolder(path) {
  var imageFolder = Folder(path + "/images");
  if (!imageFolder.exists) {
    return imageFolder.create();
  }
  return true;
}

function changeName(fileRef, srcName, destName, level) {
  var file = File(fileRef);
  var doc = app.open(file);
  var missingLink = [];
  var pathSrcName = srcName.replace("/", "_");
  var pathDestName = destName.replace("/", "_");

  app.findTextPreferences = app.changeTextPreferences = null;
  app.findTextPreferences.findWhat = srcName;
  app.changeTextPreferences.changeTo = destName;
  doc.changeText();

  if (level == 1) {
    progress(doc.links.length);
  }

  for (var d = 0; d < doc.links.length; d++) {
    var link = doc.links[d];
    var linkFile = File(link.filePath);
    if (level == 1) {
      progress.message(d + 1 + " / " + doc.links.length + " : " + linkFile.getFileNameWithExtension());
    }
    if (link.status == LinkStatus.NORMAL) {
      if (linkFile.getFileExtension() == "ai") {
        linkFile.close();
        continue;
      }
      var linkExtension = linkFile.getFileExtension();
      if (linkExtension == "indd") {
        var res = changeName(linkFile.getFullPath(), srcName, destName, level + 1);
        missingLink = missingLink.concat(res[0]);
        var reLinkFile = File(res[1]);
        link.relink(reLinkFile);
        reLinkFile.close();
      } else {
        renameFile(linkFile, pathSrcName, pathDestName);

        var folderPath = linkFile.getFolderPath();

        // rename folder only in image folder
        if (folderPath.indexOf("image") != -1) {
          var folderName = linkFile.getParentDirectoryName().replace(pathSrcName, pathDestName);
          var newFolder = Folder(folderPath);
          newFolder.rename(folderName);
          var newFile = File(newFolder.fsName + "/" + linkFile.getFileNameWithExtension());
          link.relink(newFile);
        } else {
          link.relink(linkFile);
        }
      }
    } else if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    } else if (link.status == LinkStatus.LINK_MISSING) {
      missingLink.push(link.filePath);
    }
    linkFile.close();

    if (level == 1) progress.increment();
  }

  var newFileName = file.getFileName().replace(pathSrcName, pathDestName);
  var newFile = File(file.getFolderPath() + "/" + newFileName + "." + file.getFileExtension());
  var newFilePath = newFile.getFullPath();

  doc.save(newFile);
  doc.close();
  newFile.close();
  file.remove();

  if (level == 1) progress.close();
  return [missingLink, newFilePath];
}

function renameFile(file, srcName, destName) {
  var newFileName = file.getFileName().replace(srcName, destName) + "." + file.getFileExtension();
  return file.rename(newFileName);
}

function isImage(extension) {
  return extension == "psd" || extension == "jpg" || extension == "png";
}

function moveLinkTo(fileRef, destFolder, level) {
  var file = File(fileRef);
  var doc = app.open(file);

  var missing = {};
  missing[file.getFileNameWithExtension()] = [];

  var links = doc.links;
  if (level == 1) {
    progress(links.length);
  }

  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);
    var linkExtension = linkFile.getFileExtension();
    var linkFolder = linkFile.getFolderPath();

    if (level == 1) {
      progress.message(i + " / " + links.length + " : " + linkFile.getFileNameWithExtension());
    }

    if (file.getFileName().toLowerCase().indexOf("all") != -1 && linkExtension != "indd") {
      if (level == 1) progress.increment();
      continue;
    }

    if (link.status != LinkStatus.LINK_MISSING) {
      if (linkExtension == "indd" || linkFolder.indexOf("image") == -1) {
        if (linkExtension == "indd") {
          var targetFolder = Folder(destFolder);
          var targetFile = File(targetFolder.fsName + "/" + linkFile.getFileNameWithExtension());
        } else {
          if (links.length > 1) {
            var idxFile = "-" + String(i + 1);
          } else {
            var idxFile = "";
          }
          var targetFolder = Folder(destFolder + "/images/" + file.getFileName());
          var targetFile = File(targetFolder.fsName + "/" + file.getFileName() + idxFile + "." + linkFile.getFileExtension());
        }

        if (!targetFolder.exists) {
          targetFolder.create();
        }

        if (!targetFile.exists) {
          linkFile.copy(targetFile);
          // linkFile.remove();
          link.relink(targetFile);
        }

        if (linkExtension == "indd") {
          var this_miss = moveLinkTo(targetFile.getFullPath(), destFolder, level + 1);
          for (var key in this_miss) {
            if (key in missing) {
              missing[key] = missing[key].concat(this_miss[key]);
            } else {
              missing[key] = this_miss[key];
            }
          }
        }
        link.update();
        targetFile.close();
      }
    } else {
      missing[file.getFileNameWithExtension()].push(linkFile.getFullPath());
    }

    if (level == 1) progress.increment();

    linkFile.close();
  }

  doc.save(file);
  doc.close();

  if (level == 1) progress.close();

  return missing;
}

function moveLink(fileRef) {
  var file = File(fileRef);
  var folderPath = file.getFolderPath();

  createImageFolder(folderPath);

  var missing = moveLinkTo(fileRef, folderPath, 1);

  var folder_array = [];
  var link_array = [];
  var notUsedFiles = [];

  // check unused files in the root folder
  if (file.getFileName().toLowerCase().indexOf("all") != -1 && file.getFileExtension() == "indd") {
    var fileSearch = Folder(folderPath).getFiles("*.indd");
    for (var i = 0; i < fileSearch.length; i++) {
      folder_array.push(fileSearch[i].getFullPath());
    }

    var doc = app.open(file);
    var links = doc.links;
    for (i = 0; i < links.length; i++) {
      var link = links[i];
      var t_file = File(link.filePath);
      link_array.push(t_file.getFullPath());
      t_file.close();
    }
    doc.close();

    for (i = 0; i < folder_array.length; i++) {
      if (!link_array.includes(folder_array[i]) && folder_array[i] != file.getFullPath()) {
        notUsedFiles.push(folder_array[i]);
      }
    }
  }
  file.close();
  return [missing, notUsedFiles];
}

function updateAllOutdatedLinks(doc) {
  var missingLink = [];
  for (var d = 0; d < doc.links.length; d++) {
    var link = doc.links[d];
    if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    } else if (link.status == LinkStatus.LINK_MISSING) {
      missingLink.push(link.filePath);
    }
  }
  return missingLink;
}

function reLink(doc, folderPath, extension) {
  var links = doc.links;
  for (var i = 0; i < links.length; i++) {
    if (links[i].status == LinkStatus.LINK_MISSING) {
      var imgFolder = Folder(folderPath).getFiles(links[i].name + extension);
      links[i].relink(imgFolder[0]);
    }
  }
}

function find_files(dir, fileName, fileExtension, isEarlyTerminate) {
  return find_files_sub(dir, fileName, fileExtension, isEarlyTerminate);
}

function find_files_sub(dir, fileName, fileExtension, isEarlyTerminate) {
  var array = [];
  var searchKey = "*" + fileName + "*." + fileExtension;

  var fileSearch = Folder(dir).getFiles(searchKey);
  for (var i = 0; i < fileSearch.length; i++) {
    array.push(fileSearch[i]);
    if (isEarlyTerminate && array.length > 0) {
      return array;
    }
  }

  var folderSearch = Folder(dir).getFiles("*.*");
  for (var i = 0; i < folderSearch.length; i++) {
    if (folderSearch[i] instanceof Folder) {
      var res = find_files_sub(folderSearch[i], fileName, fileExtension, isEarlyTerminate);
      array = array.concat(res);
      if (isEarlyTerminate && array.length > 0) {
        return array;
      }
    }
  }
  return array;
}

function findLink(fileRef, findFolder) {
  var file = File(fileRef);
  if (findFolder == "") {
    findFolder = file.getFolderPath();
  }
  var doc = app.open(file);
  var missingLink = [];

  for (var d = 0; d < doc.links.length; d++) {
    var link = doc.links[d];
    var linkFile = File(link.filePath);
    var linkFileNameWithExtension = linkFile.getFileNameWithExtension();
    if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    } else if (link.status == LinkStatus.LINK_MISSING) {
      // if link missing find link in findFolder (recursively find in subfolder)
      var founds = find_files(findFolder, linkFile.getFileName(), linkFile.getFileExtension(), (isEarlyTerminate = true));
      if (founds.length > 0) {
        link.relink(founds[0]);
      } else {
        missingLink.push(linkFileNameWithExtension);
      }
    } else if (link.status == LinkStatus.NORMAL) {
      // check child link of normal link
      var childLinks = link.links;
      for (var k = 0; k < childLinks.length; k++) {
        if (childLinks[k].status == LinkStatus.LINK_MISSING) {
          missingLink.push(linkFileNameWithExtension);
          break;
        }
      }
    }
    linkFile.close();
  }

  doc.save(file);
  file.close();

  if (missingLink.length == 0) {
    doc.close();
  }

  return missingLink;
}

function splitText(text, maxLength) {
  var path = text.split("\\");
  var texts = [];
  var line = "";
  for (var i = 0; i < path.length; i++) {
    if (line.length + path[i].length <= maxLength) {
      line += path[i] + "\\";
    } else {
      texts.push(line);
      line = path[i] + "\\";
    }
  }
  texts.push(line);
  return texts;
}

function progress(steps) {
  var b;

  var t;

  var w;

  w = new Window("palette", "Progress", undefined, { closeButton: true });

  t = w.add("statictext", undefined, undefined, { name: "text_progress" });

  t.preferredSize = [450, -1]; // 450 pixels wide, default height.

  if (steps) {
    b = w.add("progressbar", undefined, 0, steps);

    b.preferredSize = [450, -1]; // 450 pixels wide, default height.
  }

  progress.close = function () {
    w.close();
  };

  progress.increment = function () {
    b.value++;
    w.update();
  };

  progress.message = function (message) {
    t.text = message;
  };

  w.show();
}

function getPriceText(rawPriceText) {
  rawPriceText = rawPriceText.replace("\u0e23\u0e32\u0e04\u0e32\u0e0a\u0e38\u0e14\u0e25\u0e30", "");
  rawPriceText = rawPriceText.replace("\u0e23\u0e32\u0e04\u0e32", "");
  rawPriceText = rawPriceText.replace(" ", "");
  rawPriceText = rawPriceText.replace(".-", "");
  return rawPriceText;
}

function updatePrice(fileRef, newPrice) {
  var file = File(fileRef);
  var doc = app.open(file);
  var currentPrice = -1;

  for (var i = 0; i < app.activeDocument.stories.length; i++) {
    var story = app.activeDocument.stories.item(i);
    var content = story.contents;

    if (content.indexOf("\u0e23\u0e32\u0e04\u0e32") != -1) {
      currentPriceText = getPriceText(content);
      currentPrice = parseFloat(currentPriceText.replace(",", ""));

      if (currentPrice != newPrice) {
        app.findTextPreferences = app.changeTextPreferences = null;
        app.findTextPreferences.findWhat = content;
        // current logic only support up to 3 decimal place
        newPriceText = content.replace(currentPriceText, newPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        app.changeTextPreferences.changeTo = newPriceText;
        doc.changeText();
        doc.save(file);
      }
    }
  }

  doc.close();
  file.close();
  return currentPrice;
}

function exportPDF(file, outputPath) {
  var notSavingFiles = "";
  var folderPath = file.getFolderPath();
  var relativePath = folderPath.split("\\Catalog2023\\")[1];
  var newFileName = relativePath.split("\\").join("_") + "_" + file.getFileName();

  var destFile = File(outputPath + "/" + newFileName + ".pdf");
  if (!destFile.exists) {
    var doc = app.open(file);
    var missingLink = updateAllOutdatedLinks(doc);

    var maxPage = 1;
    var links = doc.links;

    // Find Maximum Page
    for (i = 0; i < links.length; i++) {
      var link = links[i];
      var linkFile = File(link.filePath);
      var linkExtension = linkFile.getFileExtension();

      if (linkExtension == "indd") {
        link.show();
        var aSel = doc.selection[0];
        var page = Number(aSel.parentPage.name);
        maxPage = Math.max(maxPage, page);
      }

      linkFile.close();
    }

    app.pdfExportPreferences.pageRange = "1-" + maxPage;
    doc.exportFile(ExportFormat.PDF_TYPE, destFile, false, "PDFX-4");

    doc.save(file);
    doc.close();
  } else {
    notSavingFiles = destFile.getFileName();
  }
  destFile.close();
  return notSavingFiles;
}

var X_POS = [4.5, 55.5, 106.5, 157.5];
var Y_POS = [53, 92, 131, 170, 209, 248];

function getLinkPosition(doc, link) {
  link.show();
  var aSel = doc.selection[0];
  var SelBounds = aSel.geometricBounds;
  var y = SelBounds[0];
  var x = SelBounds[1];
  var page = Number(aSel.parentPage.name);
  return [y, x, page];
}

function moveAfterItem(itemCode) {
  var doc = app.activeDocument;
  doc.documentPreferences.facingPages = false;

  var after_x = 0;
  var after_y = 0;
  var after_page = 0;
  var moveItems = [];
  var isFound = false;

  var links = doc.links;

  // Find Postion of Move Item
  for (i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);
    var linkName = linkFile.getFileName();
    var linkExtension = linkFile.getFileExtension();

    if (linkName.indexOf(itemCode) != -1 && linkExtension == "indd") {
      var info = getLinkPosition(doc, link);
      after_y = info[0];
      after_x = info[1];
      after_page = info[2];
      isFound = true;
      break;
    }
    linkFile.close();
  }

  if (!isFound) {
    return false;
  }

  // Find Movalbe Item by comparing position
  for (i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);
    var linkName = linkFile.getFileName();
    var linkExtension = linkFile.getFileExtension();
    if (linkExtension == "indd") {
      var info = getLinkPosition(doc, link);
      y = info[0];
      x = info[1];
      page = info[2];

      if (page > after_page || (page == after_page && ((x - after_x > 5 && y == after_y) || y - after_y > 5))) {
        moveItems.push(link);
      }
    }
    linkFile.close();
  }

  for (var i = 0; i < moveItems.length; i++) {
    moveToNextPosition(doc, moveItems[i]);
  }

  doc.documentPreferences.facingPages = true;
  return true;
}

function moveToNextPosition(doc, link) {
  var parent = link;

  while (!(parent.parent instanceof Spread)) {
    parent = parent.parent;
  }

  if (parent instanceof Link) {
    parent.show();
    var aSel = doc.selection[0];
  } else {
    var aSel = parent;
  }
  var SelBounds = aSel.geometricBounds;
  y = SelBounds[0];
  x = SelBounds[1];
  check_x = [];
  check_y = [];
  for (var i = 0; i < X_POS.length; i++) {
    check_x.push(Math.abs(X_POS[i] - x));
  }
  for (var i = 0; i < Y_POS.length; i++) {
    check_y.push(Math.abs(Y_POS[i] - y));
  }
  var minIndex_x = check_x.indexOfMinimum();
  var minIndex_y = check_y.indexOfMinimum();

  if (minIndex_x == check_x.length - 1) {
    if (minIndex_y != check_y.length - 1) {
      parent.move(Array(X_POS[0], Y_POS[minIndex_y + 1]));
    } else {
      cur_page = Number(parent.parentPage.name);
      if (Number(cur_page) < doc.pages.length) {
        parent.move(doc.pages[Number(cur_page)]);
        parent.move(Array(X_POS[0], Y_POS[0]));
      }
    }
  } else {
    parent.move(Array(X_POS[minIndex_x + 1], y));
  }
}

function fixBleed(file) {
  var doc = app.open(file);
  var bleedPoint = 3;

  doc.documentPreferences.facingPages = false;

  doc.documentPreferences.properties = {
    documentBleedUniformSize: true,
    documentBleedTopOffset: bleedPoint + " mm",
  };

  var links = doc.links;

  for (i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);

    if (linkFile.getFileNameWithExtension() == "P02.ai") {
      if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
        link.update();
      }

      var parent = link;
      while (!(parent.parent instanceof Spread)) {
        parent = parent.parent;
      }

      setBleed(parent, bleedPoint);
    }

    linkFile.close();
  }

  doc.save(file);
  doc.close();
}

function setBleed(pi, bp) {
  pi.locked = false;

  pi.geometricBounds = Array(-bp, -bp, 297 + bp, 210 + bp);
  pi.fit(FitOptions.CONTENT_TO_FRAME);

  pi.locked = true;
}

function exportImage(file, outputPath, lastModified) {
  var notSavingFiles = "";
  var newFileName = file.getFileName();

  var destFile = File(outputPath + "/" + newFileName + ".jpg");

  if (!destFile.exists || (destFile.exists && lastModified >= (destFile.modified.getTime() + 5000))) {
    var doc = app.open(file);
    updateAllOutdatedLinks(doc);

    app.jpegExportPreferences.properties = {
      antiAlias: true,
      embedColorProfile: true,
      exportResolution: 600,
      jpegColorSpace: JpegColorSpaceEnum.RGB,
      jpegQuality: JPEGOptionsQuality.MAXIMUM,
      jpegExportRange: ExportRangeOrAllPages.EXPORT_RANGE,
      pageString: "1",
    };

    doc.exportFile(ExportFormat.JPG, destFile);

    doc.close(SaveOptions.NO);
  } else {
    notSavingFiles = destFile.getFileName();
  }
  destFile.close();
  return notSavingFiles;
}
