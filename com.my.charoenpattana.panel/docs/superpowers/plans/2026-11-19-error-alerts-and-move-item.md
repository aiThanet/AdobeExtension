# Error Alerts + Move Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every panel alerts the full error instead of failing silently, and Move Item supports "insert after" / "remove & shift up" using real product positions instead of a hardcoded grid.

**Architecture:** A shared `runJsx()` promise helper + global error handlers in `js/myutil.js` (loaded by every panel) catch the error strings JSX.js returns. Host `start*()` functions get `try/finally` to restore InDesign state. Move Item splits into pure ordering/planning functions (testable in Node) and thin InDesign glue.

**Tech Stack:** CEP panel (jQuery, ES6 in Chromium), ExtendScript ES3 host (`jsx/*.jsx`), JSX.js bridge. Node 24 only for the check script.

**Spec:** `docs/superpowers/specs/2026-11-19-error-alerts-and-move-item-design.md`

## Global Constraints

- Host code (`jsx/*.jsx`) is ExtendScript **ES3**: no `let`/`const`, arrow functions, template literals, `Array.prototype.map/filter/forEach`, or `JSON.stringify` in new code (use `JSON.lave` already in `jsx/json.jsx` if needed).
- Note `jsx/utils.jsx` overrides `Array.prototype.indexOf` (returns the *last* match). Don't rely on it in new code.
- Product = the top-level page item (parent is `Spread`) containing a placed link whose extension is `indd`. Only products are slots and only products move.
- Row tolerance: tops within **5 mm** = same row.
- Insert mode: the last product does not move; the result message asks the user to move it manually.
- Run all checks with: `node tests/check.js` → prints `ALL OK`, exit code 0.
- UI copy is Thai, matching existing panels.

## Review Focus

1. Code matches several products (e.g. `123` also matches `1234`). Expected: the first in reading order is the target. → test `findTargetIndex` in Task 4.
2. Same-row products whose tops differ by < 5 mm, with the first one slightly lower. Expected: still one row, ordered by left. → test in Task 4.
3. Remove mode where the target is the last product. Expected: delete only, nothing moves. → test `planMoves` in Task 4.
4. Error in chunk N of a multi-chunk panel (exportPDF, updatePrice, ...). Expected: one alert, the remaining chunks stop, and the confirm button is re-enabled. → manual check in Task 3.
5. Code typed with `"` or `\`. Expected: no broken script. Pass it with `JSON.stringify(code)`, not `"${code}"`. → Task 5 step.

---

### Task 1: Shared error helper

**Files:**
- Modify: `js/myutil.js` (append)
- Create: `tests/check.js`

**Interfaces:**
- Produces: `isJsxError(res: string) -> boolean`; `runJsx(script: string) -> Promise<string>` (resolves with the raw result; on error it alerts the full text and rejects with an `Error` whose `.alerted === true`); global `window.onerror` + `unhandledrejection` alert (skip reasons with `.alerted`).

- [ ] **Step 1: Write the failing check** `tests/check.js`. Load `js/myutil.js` in `vm` with stubs `$ = () => ({ on(){} })`, `jsx = { file(){}, evalScript(){} }`, `window = { addEventListener(){} }`, `alert(){}`. Then:

```js
assert.equal(isJsxError("Error 21: undefined is not an object\nLine: 3"), true);
assert.equal(isJsxError("TypeError 24: x is not a function"), true);
assert.equal(isJsxError("Error undefined: ไม่พบรหัส"), true);
assert.equal(isJsxError("EvalScript error."), true);
assert.equal(isJsxError('["a.indd"]'), false);
assert.equal(isJsxError(""), false);
assert.equal(isJsxError("true"), false);
console.log("ALL OK");
```

- [ ] **Step 2: Run** `node tests/check.js` → FAIL (`isJsxError is not defined`).
- [ ] **Step 3: Implement** in `js/myutil.js`: `isJsxError` = `res === "EvalScript error." || /^[A-Za-z]*Error[^:\n]*: /.test(res)`. Then `runJsx` wraps `jsx.evalScript(script, cb)` in a Promise. Global handlers alert `message + "\n" + stack`.
- [ ] **Step 4: Run** `node tests/check.js` → `ALL OK`.
- [ ] **Step 5: Commit** `feat: add runJsx helper and global error alerts`.

### Task 2: Restore InDesign state on host errors (C)

**Files:**
- Modify: `jsx/index.jsx`: the anonymous/first function at lines 1–9, `startChangeName`, `startFindLink`, `startUpdatePrice`, `startExportPDF`, `startExportPDFillustrator`, `startExportImageAllCatalog`, `startExportImageAllCatalogillustrator`, `startMoveItem`, `startFixBleed`, `startExportImage`

**Interfaces:** none new. Behavior on success is unchanged; errors still propagate (no `catch`).

- [ ] **Step 1: Wrap each body** after the interaction-level line in `try { ... } finally { <existing restore line>; <progress.close() if that function opened progress> }`. Move the existing restore/close lines into `finally` (don't duplicate them). Keep `return` values inside `try`.
- [ ] **Step 2: Verify in InDesign:** temporarily add `throw new Error("test")` inside `startFixBleed`, run Fix Bleed, and check that the progress bar closes and dialogs work afterwards (e.g. File → Open shows its dialog). Remove the throw.
- [ ] **Step 3: Commit** `fix: restore interaction level and progress on host errors`.

### Task 3: Route every panel through runJsx

**Files:**
- Modify: `client/changeName/index.js`, `client/exportImage/index.js`, `client/exportImageAllCatalog/index.js`, `client/exportImageAllCatalogillustrator/index.js`, `client/exportPDF/index.js`, `client/exportPDFillustrator/index.js`, `client/findLink/index.js`, `client/fixBleed/index.js`, `client/moveImageLink/index.js`, `client/updatePrice/index.js` (moveItem is Task 5)

**Interfaces:**
- Consumes: `runJsx(script) -> Promise<string>` (Task 1).

- [ ] **Step 1: Convert each call.** Replace `jsx.evalScript(s, res => {...})` and `await new Promise(r => jsx.evalScript(s, out => r(out)))` with `const res = await runJsx(s);` followed by the former callback body. Make click handlers `async` where needed. Don't catch the rejection: it is already alerted, and it stops the handler and any remaining chunks.
- [ ] **Step 2: Where a handler disables `#confirm`**, wrap its body in `try { ... } finally { $("#confirm").prop("disabled", false); }`.
- [ ] **Step 3: Verify in InDesign,** per panel. Temporarily rename the host function it calls in `jsx/index.jsx` and reload: expect one alert with the full `ReferenceError ...` text, a re-enabled button, and no spinner hang. Restore the name. Also run each panel once on real files to confirm normal output is unchanged.
- [ ] **Step 4: Commit** `fix: alert host errors in all panels`.

### Task 4: Move Item pure logic

**Files:**
- Modify: `jsx/utils.jsx` (add near the existing move code, ~line 626)
- Modify: `tests/check.js`

**Interfaces:**
- Produces (ES3):
  - `orderProducts(products: Array<{page:number, top:number, left:number, code:string}>, rowTol:number) -> Array` (new array in reading order).
  - `findTargetIndex(ordered: Array, code:string) -> number` (first index whose `code` contains `code`, else `-1`).
  - `planMoves(count:number, t:number, mode:"insert"|"remove") -> Array<{from:number, to:number}>`, in execution order.

- [ ] **Step 1: Add failing checks.** Load `jsx/utils.jsx` in `vm` with stub `File = function(){}`; strip a leading BOM before running.

```js
const P = (page, top, left, code) => ({ page, top, left, code });
const ordered = orderProducts([P(1,88,57,"C"),P(0,49.75,57,"B"),P(0,52,9,"A"),P(0,88,9,"D2")].reverse(), 5);
assert.deepEqual(ordered.map(p=>p.code), ["A","B","D2","C"]);  // A is 2.25mm lower but same row → ordered by left; D2 next row; page 1 last
assert.equal(findTargetIndex(ordered, "B"), 1);
assert.equal(findTargetIndex(ordered, "X"), -1);
assert.equal(findTargetIndex([P(0,0,0,"x1234"),P(0,0,50,"x123")], "123"), 0);
assert.deepEqual(planMoves(5, 1, "insert"), [{from:3,to:4},{from:2,to:3}]); // last (4) stays
assert.deepEqual(planMoves(5, 4, "insert"), []);
assert.deepEqual(planMoves(5, 1, "remove"), [{from:2,to:1},{from:3,to:2},{from:4,to:3}]);
assert.deepEqual(planMoves(5, 4, "remove"), []);
```

- [ ] **Step 2: Run** `node tests/check.js` → FAIL (`orderProducts is not defined`).
- [ ] **Step 3: Implement.** `orderProducts`: copy the array, sort by `(page, top)`, then walk it and start a new row when `top - rowStartTop > rowTol` or the page changes. Sort each row by `left` and concatenate. `planMoves`: insert = `i` from `count-2` down to `t+1` → `{from:i, to:i+1}`; remove = `i` from `t+1` up to `count-1` → `{from:i, to:i-1}`.
- [ ] **Step 4: Run** `node tests/check.js` → `ALL OK`.
- [ ] **Step 5: Commit** `feat: dynamic product ordering and move planning`.

### Task 5: Move Item glue + UI

**Files:**
- Modify: `jsx/utils.jsx`: replace `moveAfterItem`, `getLinkPosition`, `moveToNextPosition`, `X_POS`, `Y_POS` (lines 626–740)
- Modify: `jsx/index.jsx:185-189` (`startMoveItem`)
- Modify: `client/moveItem/index.html`, `client/moveItem/index.js`

**Interfaces:**
- Consumes: `orderProducts`, `findTargetIndex`, `planMoves` (Task 4); `runJsx` (Task 1); `try/finally` pattern (Task 2).
- Produces: `collectProducts(doc) -> Array<{item, page, top, left, code}>`; `moveItems(doc, code, mode) -> string` (summary); `startMoveItem(goodCode:string, mode:"insert"|"remove") -> string`.

- [ ] **Step 1: `collectProducts(doc)`.** For each `doc.links` with extension `indd`, walk `.parent` until `parent.parent instanceof Spread`. Skip if the walk fails or `item.parentPage` is null (pasteboard). Dedupe by `item.id`. Read `page = item.parentPage.documentOffset`, `[top, left] = item.geometricBounds`, and `code = File(link.filePath).getFileName()`. Don't use `link.show()`.
- [ ] **Step 2: `moveItems(doc, code, mode)`.** `ordered = orderProducts(collectProducts(doc), 5)`, then `t = findTargetIndex(...)`. If `t == -1`, `throw new Error("ไม่พบรหัส " + code)`. Snapshot `P[i] = {page, top, left}` before any change. In remove mode, `ordered[t].item.remove()` first. For each `{from, to}` from `planMoves`: if the page differs, `item.move(doc.pages[P[to].page])`, then `item.move([P[to].left, P[to].top])`. Return a Thai summary with the number moved. In insert mode with `t < n-1`, also add "โปรดย้าย <code of ordered[n-1]> เอง".
- [ ] **Step 3: `startMoveItem(goodCode, mode)`** returns `moveItems(app.activeDocument, goodCode, mode)` inside the Task 2 `try/finally`. Delete the now-unused `X_POS`, `Y_POS`, `getLinkPosition`, `moveToNextPosition`, `moveAfterItem`, and `indexOfMinimum` if nothing else uses it (grep first).
- [ ] **Step 4: UI.** Add two radios `name="mode"` above the code input: `value="insert"` "แทรกต่อจาก" (checked) and `value="remove"` "ลบรายการนี้และเลื่อนขึ้น". Confirm text for remove: `ต้องการลบ "${code}" และเลื่อนรายการถัดไปขึ้น หรือไม่`. Call `const res = await runJsx(\`startMoveItem(${JSON.stringify(code)}, "${mode}")\`); alert(res);`.
- [ ] **Step 5: Run** `node tests/check.js` → `ALL OK` (utils.jsx still loads).
- [ ] **Step 6: Verify in InDesign** on a copy of a real catalog:
  - Insert mid-page: later products shift one slot and the last product stays. The alert names it.
  - Insert across a page break: the last product on page N moves to the first slot of N+1.
  - Target is the last product: nothing moves.
  - Remove mid-page and across a page break: the target is deleted and later products shift back.
  - Unknown code: alert "ไม่พบรหัส ...".
  - Non-product items (headers, images, text) don't move.
  - A product with nested links inside its `.indd` counts once.
- [ ] **Step 7: Commit** `feat: move item insert/remove using real product positions`.
