// Run: node tests/check.js
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const load = (file, ctx) => vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8").replace(/^﻿/, ""), ctx);

const ui = vm.createContext({ $: () => ({ on() {} }), jsx: { file() {}, evalScript() {} }, window: { addEventListener() {} }, alert() {} });
load("js/myutil.js", ui);
const { isJsxError } = ui;
assert.equal(isJsxError("Error 21: undefined is not an object\nLine: 3"), true);
assert.equal(isJsxError("TypeError 24: x is not a function"), true);
assert.equal(isJsxError("Error undefined: ไม่พบรหัส"), true);
assert.equal(isJsxError("EvalScript error."), true);
assert.equal(isJsxError('["a.indd"]'), false);
assert.equal(isJsxError(""), false);
assert.equal(isJsxError("true"), false);

const host = vm.createContext({ File: function () {} });
load("jsx/utils.jsx", host);
const { orderProducts, findTargetIndex, planMoves } = host;
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b); // cross-realm objects
const P = (page, top, left, code) => ({ page, top, left, code });
const ordered = orderProducts([P(1, 88, 57, "C"), P(0, 49.75, 57, "B"), P(0, 52, 9, "A"), P(0, 88, 9, "D2")].reverse(), 5);
same(ordered.map(p => p.code), ["A", "B", "D2", "C"]); // A 2.25mm lower but same row -> by left; page 1 last
assert.equal(findTargetIndex(ordered, "B"), 1);
assert.equal(findTargetIndex(ordered, "X"), -1);
assert.equal(findTargetIndex([P(0, 0, 0, "x1234"), P(0, 0, 50, "x123")], "123"), 0);
same(planMoves(5, 1, "insert"), [{ from: 3, to: 4 }, { from: 2, to: 3 }]); // last (4) stays
same(planMoves(5, 4, "insert"), []);
same(planMoves(5, 1, "remove"), [{ from: 2, to: 1 }, { from: 3, to: 2 }, { from: 4, to: 3 }]);
same(planMoves(5, 4, "remove"), []);

// nextSlot: where the last product goes on insert. Products 40 wide, 30 tall.
const { nextSlot } = host;
const S = (page, top, left) => ({ page, top, left, width: 40, height: 30 });
const A4 = { right: 210, bottom: 297 };
const grid = [S(0, 50, 9), S(0, 50, 57), S(0, 90, 9), S(0, 90, 57)]; // page 0: 2x2
// rule 1: copy the previous page's layout
same(nextSlot([...grid, S(1, 50, 9)], 4, 5, A4, 3), { page: 1, top: 50, left: 57 });
same(nextSlot([...grid, S(1, 50, 9), S(1, 50, 57), S(1, 90, 9), S(1, 90, 57)], 7, 5, A4, 3), { page: 2, top: 50, left: 9 }); // page full
assert.equal(nextSlot([...grid, S(1, 50, 9), S(1, 50, 57), S(1, 90, 9), S(1, 90, 57)], 7, 5, A4, 2), null); // no next page
// rule 2: first page, measure gaps (h gap 57-49=8, v gap 0 with one row)
const row = [S(0, 50, 9), S(0, 50, 57)];
same(nextSlot(row, 1, 5, A4, 1), { page: 0, top: 50, left: 105 });
same(nextSlot(row, 1, 5, { right: 140, bottom: 297 }, 1), { page: 0, top: 80, left: 9 }); // 105+40 > 140 -> next row
same(nextSlot(row, 1, 5, { right: 140, bottom: 100 }, 2), { page: 1, top: 50, left: 9 }); // 80+30 > 100 -> next page
assert.equal(nextSlot(row, 1, 5, { right: 140, bottom: 100 }, 1), null);
// rule 2 with two rows: v gap 90-(50+30)=10
same(nextSlot(grid, 3, 5, { right: 140, bottom: 297 }, 1), { page: 0, top: 130, left: 9 });

console.log("ALL OK");
