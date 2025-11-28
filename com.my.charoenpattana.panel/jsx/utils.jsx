Array.prototype.includes = function (obj) {
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
    doc.exportFile(ExportFormat.PDF_TYPE, destFile, false, "MyPreset");

    doc.save(file);
    doc.close();
  } else {
    notSavingFiles = destFile.getFileName();
  }
  destFile.close();
  return notSavingFiles;
}

function exportImageAllCatalog(file, outputPath) {
  var folderPath = file.getFolderPath();
  var relativePath = folderPath.split("\\Catalog2023\\")[1];
  var newFileName = relativePath.split("\\").join("_") + "_" + file.getFileName();

  var checkFile = File(outputPath + "/" + newFileName + "_01.png")

  if (!checkFile.exists) {
    var doc = app.open(file);
    var destFile = File(outputPath + "/" + newFileName + ".png");
    updateAllOutdatedLinks(doc);

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

    app.pngExportPreferences.properties = {
      antiAlias: true,
      pngColorSpace: PNGColorSpaceEnum.RGB,
      pngQuality: PNGQualityEnum.MAXIMUM,
      pngExportRange: ExportRangeOrAllPages.EXPORT_RANGE,
      transparentBackground: true,
      exportResolution: 300,
      pngSuffix: '_^P',
      pageString: "1-" + maxPage,
    };

    doc.exportFile(ExportFormat.PNG_FORMAT, destFile);
    doc.close(SaveOptions.NO);
    destFile.close();
  }

  checkFile.close();

  return "";
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
  /* ========= Settings / constants ========= */
  var LEFT_RIGHT_M = 9;       // mm
  var RIGHT_POS = 201;     // mm

  app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
  doc.documentPreferences.facingPages = false;

  /**
 * Get the top-level rectangle that contains a link (placed INDD, image, etc).
 * For INDD: Link -> Graphic -> Rectangle
 */
  function getLinkParentRectangle(link) {
    var item = link
    while (!(item.parent instanceof Rectangle)) {
      item = item.parent;
    }
    return item
  }

  /* ========= 1) Set margins on master spreads & pages ========= */
  // Master spreads
  for (var i = 0; i < doc.masterSpreads.length; i++) {
    var ms = doc.masterSpreads[i];
    for (var j = 0; j < ms.pages.length; j++) {
      var mp = ms.pages[j].marginPreferences;
      mp.left = LEFT_RIGHT_M;
      mp.right = LEFT_RIGHT_M;
    }
  }
  // All document pages
  for (i = 0; i < doc.pages.length; i++) {
    var pageMargins = doc.pages[i].marginPreferences;
    pageMargins.left = LEFT_RIGHT_M;
    pageMargins.right = LEFT_RIGHT_M;
  }

  /* ========= 2) Fix text frames that cross margins ========= */
  var allItems = doc.allPageItems;
  for (i = 0; i < allItems.length; i++) {
    var item = allItems[i];

    if (item instanceof TextFrame) {
      var gb = item.geometricBounds;
      var left = gb[1];
      var width = gb[3] - gb[1];

      // if frame starts before left margin and is wide enough → clamp to margins
      if (width > 150) {
        gb[1] = LEFT_RIGHT_M;
        gb[3] = RIGHT_POS;
        item.geometricBounds = gb;
      }
    }
  }

  /* ========= 3) Process INDD links (force-save & snap to grid) ========= */
  var links = doc.links;
  for (i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);
    var linkExtension = linkFile.getFileExtension();

    if (linkExtension === "indd") {
      // Open linked INDD, save, close, then update link
      var linkDoc = app.open(linkFile);
      linkDoc.save(linkFile);  // you can add forceSave via Document.save signature if needed
      linkDoc.close();
      link.update();

      var item = getLinkParentRectangle(link);
      resizeItemToGrid(item)
      resizeItemToGrid(item.parent)
    }

  }

  /* ========= 4) Update outdated links (if any still outdated) ========= */
  updateAllOutdatedLinks(doc);

  /* ========= 5) Snap empty rectangles to grid ========= */

  for (i = 0; i < allItems.length; i++) {
    item = allItems[i];

    if (item instanceof Rectangle) {
      var hasGraphics = item.allGraphics.length > 0;
      var hasChildren = item.pageItems.length > 0;
      var hasText = false;

      // some rectangles are text frames, some are not
      try {
        if (item.contents && item.contents !== "") {
          hasText = true;
        }
      } catch (e) {
        // Non-text rectangles will throw on contents → ignore
      }

      if (!hasGraphics && !hasChildren && !hasText) {
        resizeItemToGrid(item);
      }
    }
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

function hideOnlyImage(items) {
  for (i = 0; i < items.length; i++) {
    var item = items[i];

    if (item instanceof Rectangle || item instanceof Polygon) {
      if (item.allGraphics.length > 0 && (item.allGraphics[0].imageTypeName == "JPEG" || item.allGraphics[0].imageTypeName == "PNG" || item.allGraphics[0].imageTypeName == "TIFF" || item.allGraphics[0].imageTypeName == "Photoshop")) {
        continue;
      }
    }

    if (item instanceof Group || item instanceof Image) {
      continue;
    }

    item.visible = false;
  }
}

function checkFolder(outputPath, type) {
  var outputwithType = outputPath + "/" + type;

  outputwithTypeFolder = Folder(outputwithType);
  if (!outputwithTypeFolder.exists) {
    outputwithTypeFolder.create();
  }

  return outputwithType
}

function exportImage(file, rootOutputPath, backupPath, lastModified, type, exportResolution) {

  var outputPath = checkFolder(rootOutputPath, type)

  var notSavingFiles = "";
  var newFileName = file.getFileName();
  var extension = ".jpg";
  var isPNGExtension = type == "withoutDescription" || type == "withOnlyImage" || type == "withoutPricePNG";
  if (isPNGExtension) {
    extension = ".png";
  }

  var destFile = File(outputPath + "/" + newFileName + extension);

  if (!destFile.exists || (destFile.exists && lastModified >= destFile.modified.getTime() + 3000)) {
    var doc = app.open(file);
    updateAllOutdatedLinks(doc);

    if (destFile.exists && type == "withPrice") {
      destFile.copy(backupPath + "/" + newFileName + extension);
    }

    if (type.indexOf("withoutPrice") != -1) {
      var items = doc.pageItems.everyItem().getElements();
      for (i = 0; i < items.length; i++) {
        var item = items[i];

        if (item instanceof TextFrame && item.contents.indexOf("\u0e23\u0e32\u0e04\u0e32") != -1) {
          item.visible = false;
        }
      }
    }

    if (type.indexOf("withoutDescription") != -1) {
      var width = doc.pages[0].bounds[3];
      var height = doc.pages[0].bounds[2];
      var cutline = parseInt(height * 0.2);
      // var regex = /[\u0e01\u0e02\u0e03\u0e04\u0e05\u0e06\u0e07\u0e08\u0e09\u0e0a\u0e0b\u0e0c\u0e0d\u0e0e\u0e0f\u0e10\u0e11\u0e12\u0e13\u0e14\u0e15\u0e16\u0e17\u0e18\u0e19\u0e1a\u0e1b\u0e1c\u0e1d\u0e1e\u0e1f\u0e20\u0e21\u0e22\u0e23\u0e25\u0e27\u0e28\u0e29\u0e2a\u0e2b\u0e2c\u0e2d\u0e2e]/g;

      var items = doc.pageItems.everyItem().getElements();
      for (i = 0; i < items.length; i++) {
        var item = items[i];

        var bounds = item.geometricBounds;
        var y1 = parseInt(bounds[0]);
        var x1 = parseInt(bounds[1]);
        var y2 = parseInt(bounds[2]);
        // var x2 = parseInt(bounds[3]);

        if (x1 >= width || y1 >= height || y2 <= cutline || (y1 < cutline && y2 > cutline && cutline - y1 >= (y2 - y1) * 0.7)) {
          item.visible = false;
        }

        if ("contents" in item && item.contents.indexOf("\u0e43\u0e0a\u0e49") != -1) {
          item.visible = false;
        }

        // Remove all text contain Thai character
        // if ("contents" in item && item.contents.match(regex) != null) {
        //   item.visible = false;
        // }
      }
    }

    if (type.indexOf("withOnlyImage") != -1) {
      hideOnlyImage(doc.allPageItems)
    }

    // save image
    if (isPNGExtension) {
      app.pngExportPreferences.properties = {
        antiAlias: true,
        pngColorSpace: PNGColorSpaceEnum.RGB,
        pngQuality: PNGQualityEnum.MAXIMUM,
        pngExportRange: ExportRangeOrAllPages.EXPORT_RANGE,
        transparentBackground: true,
        exportResolution: exportResolution,
        pngSuffix: "",
        pageString: "1",
      };

      doc.exportFile(ExportFormat.PNG_FORMAT, destFile);
    } else {
      app.jpegExportPreferences.properties = {
        antiAlias: true,
        embedColorProfile: true,
        exportResolution: exportResolution,
        jpegColorSpace: JpegColorSpaceEnum.RGB,
        jpegQuality: JPEGOptionsQuality.MAXIMUM,
        jpegExportRange: ExportRangeOrAllPages.EXPORT_RANGE,
        jpegSuffix: "",
        pageString: "1",
      };

      doc.exportFile(ExportFormat.JPG, destFile);
    }

    doc.close(SaveOptions.NO);
  } else {
    notSavingFiles = destFile.getFileName();
  }
  destFile.close();
  return notSavingFiles;
}


/**
   * Return index of the closest value in arr to x.
   * If exactly equal (diff == 0), return -1 to indicate "already snapped".
   */
function findMinDiffIndex(x, arr) {
  var minNum = 9999;
  var minIdx = -1;

  x = parseFloat(x);

  for (var i = 0; i < arr.length; i++) {
    var diff = Math.abs(x - parseFloat(arr[i]));

    if (diff < minNum) {
      minNum = diff;
      minIdx = i;
    }
  }
  return minIdx;
}


/**
 * Resize an item so that:
 * - its left x snaps to closest column in COLUMNS_X
 * - its width becomes MAX_LINK_WIDTH
 * - height scales with same ratio
 */
function resizeItemToGrid(item) {
  
  const MAX_LINK_WIDTH = 45;      // mm
  const COLUMNS_X = [10.5, 58.5, 106.5, 154.5]; // mm positions

  var gb = item.geometricBounds; // [t, l, b, r]
  var x1 = gb[1];
  var width = gb[3] - gb[1];
  var height = gb[2] - gb[0];

  if (width === 0) return; // protect against division by zero

  var scaleRatio = MAX_LINK_WIDTH / width;
  var newHeight = height * scaleRatio;

  var minIdx = findMinDiffIndex(x1, COLUMNS_X);


  var newLeft = COLUMNS_X[minIdx];

  gb[1] = newLeft;
  gb[3] = newLeft + MAX_LINK_WIDTH;
  gb[2] = gb[0] + newHeight;

  item.geometricBounds = gb;
}

/**
 * Update all outdated links in a document.
 * Returns an array of missing link paths.
 */
function updateAllOutdatedLinks(doc) {
  var missingLink = [];
  var links = doc.links;

  for (var d = 0; d < links.length; d++) {
    var link = links[d];
    if (link.status === LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    } else if (link.status === LinkStatus.LINK_MISSING) {
      missingLink.push(link.filePath);
    }
  }
  return missingLink;
}

