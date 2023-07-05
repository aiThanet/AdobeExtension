function startMoveAllLink(files) {
  var file = files[0];
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;
  var missingLink = moveLink(file);
  var f = File(file);
  fileName = f.getFileNameWithExtension();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;

  return JSON.lave(missingLink);
}

function startChangeName(files, srcName, destName) {
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.neverInteract;

  var missing = {};
  for (var i = 0; i < files.length; i++) {
    var res = changeName(files[i], srcName, destName);
    var file = File(files[i]);
    fileName = file.getFileNameWithExtension();
    missing[fileName] = res[0];
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
    progress.message(i + 1 + " / " + files.length + " : " + fileName);
    // temporary fix rename from HG to V mismatch between catalog and system
    var tempName = fileName.replace("HG", "V");

    if (fileName in priceList || tempName in priceList) {
      newPrice = fileName in priceList ? parseFloat(priceList[fileName]) : parseFloat(priceList[tempName]); //temporary fix rename from HG to V mismatch between catalog and system
      var oldPrice = updatePrice(files[i], newPrice);
      var row = [fileName, oldPrice, newPrice];
      if (oldPrice == newPrice) {
        result.NotUpdatePrice.push(row);
      } else {
        result.UpdatedPrice.push(row);
      }
    } else {
      result.NotFoundPrice.push(fileName);
    }
    progress.increment();
    file.close();
  }
  progress.close();
  app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
  return JSON.lave(result);
}
