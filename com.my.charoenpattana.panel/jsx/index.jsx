﻿function startMoveAllLink(files) {
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