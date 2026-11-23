import test from "node:test";
import assert from "node:assert/strict";
import { columnIndex, columnName, dateStyles, parsePptx, parseXlsx, serialToText, sharedStrings, unescapeXml } from "../advanced/ignorance.file-viewers/viewers/office/core.js";

test("列字母与序号互转", () => {
  assert.equal(columnIndex("A1"), 0);
  assert.equal(columnIndex("Z9"), 25);
  assert.equal(columnIndex("AA10"), 26);
  assert.equal(columnName(0), "A");
  assert.equal(columnName(26), "AA");
  assert.equal(columnName(701), "ZZ");
});

test("XML 实体还原", () => {
  assert.equal(unescapeXml("a &amp; b &lt;c&gt; &#65;&#x42;"), "a & b <c> AB");
});

test("共享字符串合并富文本片段", () => {
  const xml = `<sst><si><t>一</t></si><si><r><t>二</t></r><r><t xml:space="preserve">三</t></r></si></sst>`;
  assert.deepEqual(sharedStrings(xml), ["一", "二三"]);
});

test("工作表解析：共享字符串、数字、布尔、内联字符串与稀疏单元格", () => {
  const files = {
    "xl/workbook.xml": `<workbook><sheets><sheet name="汇总" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/sharedStrings.xml": `<sst><si><t>姓名</t></si><si><t>得分</t></si></sst>`,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
      <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
      <row r="3"><c r="A3" t="inlineStr"><is><t>小明</t></is></c><c r="C3"><v>9.5</v></c><c r="D3" t="b"><v>1</v></c></row>
    </sheetData></worksheet>`,
  };
  const [sheet] = parseXlsx(files);
  assert.equal(sheet.name, "汇总");
  assert.deepEqual(sheet.rows[0], ["姓名", "得分"]);
  assert.deepEqual(sheet.rows[1], []);
  assert.equal(sheet.rows[2][0], "小明");
  assert.equal(sheet.rows[2][2], "9.5");
  assert.equal(sheet.rows[2][3], "TRUE");
});

test("幻灯片解析：按编号排序，标题与正文分开", () => {
  const slide = (title, ...body) => `<p:sld><p:cSld><p:spTree>
    <p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>${title}</a:t></a:r></a:p></p:txBody></p:sp>
    <p:sp><p:nvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr><p:txBody>${body.map((b) => `<a:p><a:r><a:t>${b}</a:t></a:r></a:p>`).join("")}</p:txBody></p:sp>
  </p:spTree></p:cSld></p:sld>`;
  const slides = parsePptx({
    "ppt/slides/slide10.xml": slide("十", "x"),
    "ppt/slides/slide2.xml": slide("二", "要点 &amp; 说明", "第二条"),
    "ppt/slides/slide1.xml": slide("一"),
  });
  assert.deepEqual(slides.map((s) => s.title), ["一", "二", "十"]);
  assert.deepEqual(slides[1].paras, ["要点 & 说明", "第二条"]);
});

test("xlsx 日期：内置与自定义日期格式的单元格按日期显示，普通数字不变", () => {
  const styles = `<styleSheet><numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy&quot;年&quot;m&quot;月&quot;"/><numFmt numFmtId="165" formatCode="0.00&quot;d&quot;"/></numFmts>
    <cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs></styleSheet>`;
  assert.deepEqual([...dateStyles(styles)], [1, 2]);
  const workbook = { "xl/workbook.xml": `<workbook><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>`, "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`, "xl/styles.xml": styles };
  const sheet = `<worksheet><sheetData><row r="1"><c r="A1" s="1"><v>45292</v></c><c r="B1" s="0"><v>45292</v></c><c r="C1" s="3"><v>45292</v></c><c r="D1" s="1"><v>45292.5</v></c></row></sheetData></worksheet>`;
  const [parsed] = parseXlsx({ ...workbook, "xl/worksheets/sheet1.xml": sheet });
  assert.deepEqual(parsed.rows[0], ["2024-01-01", "45292", "45292", "2024-01-01 12:00"]);
});

test("xlsx 日期：序列号转换、纯时间与 1904 纪元", () => {
  assert.equal(serialToText("45292"), "2024-01-01");
  assert.equal(serialToText("0.75"), "18:00");
  assert.equal(serialToText("0", true), "00:00");
  assert.equal(serialToText("1", true), "1904-01-02");
  assert.equal(serialToText("abc"), "abc");
});
