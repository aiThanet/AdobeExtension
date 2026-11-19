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

console.log("ALL OK");
