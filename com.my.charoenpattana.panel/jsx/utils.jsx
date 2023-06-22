Array.prototype.includes = function (obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
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

function changeName(fileRef, srcName, destName) {
  var file = File(fileRef);
  var doc = app.open(file);
  var missingLink = [];

  app.findTextPreferences = app.changeTextPreferences = null;
  app.findTextPreferences.findWhat = srcName;
  app.changeTextPreferences.changeTo = destName;
  doc.changeText();

  for (var d = 0; d < doc.links.length; d++) {
    var link = doc.links[d];
    if (link.status == LinkStatus.NORMAL) {
      var linkFile = File(link.filePath);
      var linkExtension = linkFile.getFileExtension();
      if (linkExtension == "indd") {
        var res = changeName(linkFile.getFullPath(), srcName, destName);
        missingLink = missingLink.concat(res[0]);
        link.relink(res[1]);
      } else {
        renameFile(linkFile, srcName, destName);

        var folderPath = linkFile.getFolderPath();

        // rename folder only in image folder
        if (folderPath.indexOf("image") != -1) {
          var folderName = linkFile.getParentDirectoryName().replace(srcName, destName);
          var newFolder = Folder(folderPath);
          newFolder.rename(folderName);
          var newFile = File(newFolder.fsName + "/" + linkFile.getFileNameWithExtension());
          link.relink(newFile);
        } else {
          link.relink(linkFile);
        }
        linkFile.close();
      }
    } else if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    } else if (link.status == LinkStatus.LINK_MISSING) {
      missingLink.push(link.filePath);
    }
  }

  var newFileName = file.getFileName().replace(srcName, destName);
  var newFile = File(file.getFolderPath() + "/" + newFileName + "." + file.getFileExtension());

  doc.save(newFile);
  doc.close();
  file.remove();
  return [missingLink, newFile];
}

function renameFile(file, srcName, destName) {
  var newFileName = file.getFileName().replace(srcName, destName) + "." + file.getFileExtension();
  return file.rename(newFileName);
}

function isImage(extension) {
  return extension == "psd" || extension == "jpg" || extension == "png";
}

function moveLinkTo(fileRef, destFolder) {
  var file = File(fileRef);
  var doc = app.open(file);

  var missing = {};
  missing[file.getFileNameWithExtension()] = [];

  var links = doc.links;
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var linkFile = File(link.filePath);
    var linkExtension = linkFile.getFileExtension();
    var linkFolder = linkFile.getFolderPath();

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
          var this_miss = moveLinkTo(targetFile.getFullPath(), destFolder);
          for (var key in this_miss) {
            if (key in missing) {
              missing[key] = missing[key].concat(this_miss[key]);
            } else {
              missing[key] = this_miss[key];
            }
          }
        }
        link.update();
      }
    } else {
      missing[file.getFileNameWithExtension()].push(linkFile.getFullPath());
    }
  }

  doc.save(file);
  doc.close();

  return missing;
}

function moveLink(fileRef) {
  var file = File(fileRef);
  var folderPath = file.getFolderPath();

  createImageFolder(folderPath);

  var missing = moveLinkTo(fileRef, folderPath);

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
      link_array.push(File(link.filePath).getFullPath());
    }
    doc.close();

    for (i = 0; i < folder_array.length; i++) {
      if (!link_array.includes(folder_array[i]) && folder_array[i] != file.getFullPath()) {
        notUsedFiles.push(folder_array[i]);
      }
    }
  }

  return [missing, notUsedFiles];
}

function updateAllOutdatedLinks(doc) {
  for (var d = 0; d < doc.links.length; d++) {
    var link = doc.links[d];
    if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
      link.update();
    }
  }
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
  }

  doc.save(file);

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