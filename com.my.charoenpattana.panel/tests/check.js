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

console.log("ALL OK");
