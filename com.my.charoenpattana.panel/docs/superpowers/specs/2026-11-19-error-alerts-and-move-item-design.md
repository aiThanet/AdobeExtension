# Error alerts + Move Item (dynamic slots) — design

Date: 2026-11-19 · Size: small change (short design)

## Intent
1. Every panel in `client/` must show an `alert` with the **full** error message when anything fails, instead of failing silently and requiring DevTools to debug.
2. Move Item gets two modes — **Insert after** and **Remove & shift up** — and derives slot positions from the actual product positions in the document, not the hardcoded `X_POS` / `Y_POS` grid.

## Root cause of silent errors (verified in code)
- `js/lib/JSX.js` (forceEval, default on) wraps host scripts in try/catch and **returns the error as a normal string** (`"<Name> <number>: <description>\nFile: ...\nLine: ..."`). Callbacks treat it as success.
  - `moveItem` alerts "สำเร็จ" on failure.
  - `exportPDF`, `updatePrice`, etc. `JSON.parse(res)` the error string → throws inside the callback → Promise never resolves, panel hangs, error only in console.
- `moveAfterItem` returns `false` when the code isn't found; the panel ignores it.
- `start*()` in `jsx/index.jsx` set `neverInteract` / `DONTDISPLAYALERTS` and do not restore it (or close the progress bar) when an error is thrown.

## Approaches
**Errors**
- **A (chosen):** one shared helper `runJsx(script)` in `js/myutil.js` (already loaded by every panel) + global `window.onerror` / `unhandledrejection` alert. Every `jsx.evalScript(..., cb)` call becomes `await runJsx(...)`.
- B (rejected): per-callback checks in 11 files — duplicated, new panels forget it.
- **C (chosen, add-on):** `try/finally` in each `start*()` in `jsx/index.jsx` to restore interaction level and close progress on error.

**Move Item**
- **A (chosen):** ordered list of occupied product slots; move each item to its neighbour's position.
- B (rejected): infer a per-page grid by clustering — more code, fragile with varied sizes.

## Design

### 1. Error alerts
`js/myutil.js`:
- `runJsx(script)` → `Promise<string>`. Rejects and `alert`s the full text when the result matches `/^\w*Error -?\d+: /` or equals `"EvalScript error."`. Resolves with the raw result otherwise.
- `window.onerror` and `window.addEventListener("unhandledrejection", ...)` → `alert` message + stack (covers `JSON.parse`, AJAX, any panel-side throw). Avoid double alert for errors already alerted by `runJsx` (e.g. mark the rejected Error as `alerted`).
- Each `client/*/index.js`: replace `jsx.evalScript(...)` callbacks / manual `new Promise` wrappers with `await runJsx(...)`; on rejection re-enable the confirm button (`finally`). Behaviour on success unchanged.
- Host functions that signal failure by return value (e.g. `moveAfterItem` → `false`) must instead `throw new Error("<Thai message>")` so it surfaces through the same path.

`jsx/index.jsx`: wrap the body of every `start*()` in `try { ... } finally { restore interaction level; progress.close() if opened }`. Errors still propagate (no catch) so JSX.js returns the message.

### 2. Move Item
**Product element** = the top-level page item (the item whose parent is the `Spread`) that contains a placed **`.indd`** link. Only these are slots and only these move. Everything else (images, text, headers, shapes, non-indd links) is ignored and untouched. Nested links inside a placed `.indd` must not count as separate products — dedupe by top-level item.

**Algorithm**
1. Collect every product: `{ item, page (index), top, left }` from the top-level item's `geometricBounds`.
2. Sort into reading order: page → row (tops within 5 mm = same row, existing tolerance) → left.
3. Find target index `t` = first product whose link file name contains the entered code. Not found → throw "ไม่พบรหัส ...".
4. Record all positions `P[i] = {page, top, left}` **before** moving anything.
5. Mode **Insert after**: for `i = n-2 … t+1` (reverse), move product `i` to `P[i+1]`. The **last product does not move**; alert tells the user to move `<code of last product>` manually. If `t` is the last product: nothing to move, alert that.
6. Mode **Remove**: delete the target's top-level item, then for `i = t+1 … n-1`, move product `i` to `P[i-1]`. Last slot becomes empty.
7. Moving across pages: move item to `doc.pages[P.page]`, then `move([left, top])` (same pattern the current code uses).
8. Return a summary string (moved count, mode, manual-move item) for the success alert.

**UI** (`client/moveItem/index.html`): two radio buttons above the code input — "แทรกต่อจาก" (default) / "ลบรายการนี้และเลื่อนขึ้น". Remove mode confirm text must clearly say the item will be deleted. Call `startMoveItem(code, mode)`.

Remove `X_POS`, `Y_POS`, `moveToNextPosition` once unused.

## Goals / non-goals
- Goal: no silent failure anywhere in `client/`; Move Item works on any layout.
- Non-goal: supporting a slot after the last product; filling empty gaps on a page; changing other panels' behaviour on success.
- Anti-goal: moving or counting non-product elements.

## Left to the builder
- Exact Thai wording of alerts.
- Whether `doc.links` returns nested links in this InDesign version (handle either way via top-level dedupe).
- Ruler origin assumption (per-page coordinates) — verify on a real catalog file before/after.

## Verification (manual, in InDesign)
- Force an error (e.g. bad code / call undefined fn) in each panel → alert shows full message, button re-enabled, InDesign dialogs still enabled after.
- Move Item on a test catalog: insert-after mid-page, across a page break, target = last product; remove mid-page and across a page break. Non-product elements unchanged.
