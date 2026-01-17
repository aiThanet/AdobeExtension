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

/* ========= Settings / constants ========= */

var doc            = app.activeDocument;
var LEFT_RIGHT_M   = 9;       // mm
var RIGHT_POS      = 201;     // mm

var n_columns = 2

var MAX_LINK_WIDTH = 48;      // mm
var COLUMNS_X      = [9, 57, 105, 153]; // mm positions

if(n_columns == 2) {
    MAX_LINK_WIDTH = 96;      // mm
    COLUMNS_X      = [9, 105]; // mm positions
} else if (n_columns == 4) {
    MAX_LINK_WIDTH = 48;      // mm
    COLUMNS_X      = [9, 57, 105, 153]; // mm positions
}


app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
doc.documentPreferences.facingPages = false;


/* ========= Utility functions ========= */

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
 if(item.locked){
        return
      }
  var gb = item.geometricBounds; // [t, l, b, r]
  var x1 = gb[1];
  var width  = gb[3] - gb[1];
  var height = gb[2] - gb[0];

  if (width === 0) return; // protect against division by zero

  var scaleRatio = MAX_LINK_WIDTH / width;
  var newHeight  = height * scaleRatio;

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
    mp.left  = LEFT_RIGHT_M;
    mp.right = LEFT_RIGHT_M;
    mp.columnCount  = n_columns;
    mp.columnGutter = "0mm";
  }
}

// All document pages
for (i = 0; i < doc.pages.length; i++) {
  var pageMargins = doc.pages[i].marginPreferences;
  pageMargins.left  = LEFT_RIGHT_M;
  pageMargins.right = LEFT_RIGHT_M;
  pageMargins.columnCount  = n_columns;
  pageMargins.columnGutter = "0mm";
}



/* ========= 2) Fix text frames that cross margins ========= */

var allItems = doc.allPageItems;

for (i = 0; i < allItems.length; i++) {
  var item = allItems[i];

  if (item instanceof TextFrame) {
    var gb = item.geometricBounds;
    var left  = gb[1];
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
  var linkName = linkFile.getFileName();
  var linkExtension = linkFile.getFileExtension();

  if (linkExtension === "indd") {
    // Open linked INDD, save, close, then update link
    //var linkDoc = app.open(linkFile);
    //linkDoc.save(linkFile);  // you can add forceSave via Document.save signature if needed
    //linkDoc.close();
    //link.update();

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
