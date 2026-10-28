import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import ExcelJS from "exceljs";

test("ExcelJS resolves the patched CommonJS uuid release", () => {
  const excelRequire = createRequire(require.resolve("exceljs/package.json"));
  const version = excelRequire("uuid/package.json").version as string;
  const [major, minor, patch] = version.split(".").map(Number);
  assert.ok(major > 11 || (major === 11 && (minor > 1 || (minor === 1 && patch >= 1))), version);
  assert.match(excelRequire("uuid").v4(), /^[a-f0-9-]{36}$/);
});

test("patched uuid remains compatible with ExcelJS extended conditional formatting", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Compatibility");
  sheet.getCell("A1").value = 1;
  sheet.addConditionalFormatting({
    ref: "A1:A2",
    rules: [{ type: "iconSet", iconSet: "3Stars", cfvo: [{ type: "percent", value: 0 }, { type: "percent", value: 33 }, { type: "percent", value: 67 }], priority: 1 }],
  });
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 0);
});
