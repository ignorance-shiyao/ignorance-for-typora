import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSequence, renderSequenceSvg } from "../advanced/ignorance.advanced/slides/sequence.js";
import { parseGantt, renderGanttSvg } from "../advanced/ignorance.advanced/slides/gantt.js";
import { parsePie, renderMermaidSvg } from "../advanced/ignorance.advanced/slides/mermaid.js";

const light = { dark: false, accent: "#123456", foreground: "#111111", background: "#ffffff", border: "#dddddd" };
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

const SEQ = `sequenceDiagram
  autonumber
  actor 用户
  participant API as 接口
  用户->>+API: 登录
  Note over 用户,API: 校验
  alt 成功
    API-->>-用户: 令牌
  else 失败
    API--x用户: 401
  end
  API->>API: 审计`;

test("sequence: participants, labels, messages and activation parse", () => {
  const s = parseSequence(SEQ);
  assert.deepEqual(s.people.map((p) => [p.id, p.label, p.actor]), [["用户", "用户", true], ["API", "接口", false]]);
  const msgs = s.events.filter((e) => e.type === "message");
  assert.deepEqual(msgs.map((m) => [m.from, m.to, m.op, m.sign, m.text]), [["用户", "API", "->>", "+", "登录"], ["API", "用户", "-->>", "-", "令牌"], ["API", "用户", "--x", "", "401"], ["API", "API", "->>", "", "审计"]]);
  assert.equal(s.numbered, true);
  assert.deepEqual(s.events.filter((e) => e.type.startsWith("frame")).map((e) => e.type), ["frame-start", "frame-split", "frame-end"]);
});

test("sequence: draws lifelines, arrows, frames, notes and activation bars", () => {
  const svg = renderSequenceSvg(SEQ, light);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.equal((svg.match(/stroke-dasharray="6 6"/g) || []).length, 2);
  assert.match(svg, />1\. 登录</);
  assert.match(svg, />alt</);
  assert.match(svg, /\[失败\]/);
  assert.match(svg, />校验</);
  assert.ok((svg.match(/rx="3"/g) || []).length >= 1, "an activation bar is drawn");
});

test("sequence: bad syntax and unbalanced blocks fail readably", () => {
  assert.throws(() => renderSequenceSvg("sequenceDiagram\n A ??? B", light), /无法解析序列图/);
  assert.throws(() => renderSequenceSvg("sequenceDiagram\n loop x\n A->>B: hi", light), /缺少 end/);
  assert.throws(() => renderSequenceSvg("sequenceDiagram\n A->>B: hi\n end", light), /多出一个 end/);
  assert.throws(() => renderSequenceSvg("sequenceDiagram\n participant A", light), /没有消息/);
});

const GANTT = `gantt
  title 计划
  dateFormat YYYY-MM-DD
  section 设计
    评审 :done, d1, 2026-11-02, 2026-11-06
    原型 :d2, after d1, 5d
  section 开发
    后端 :active, 2026-11-10, 2w
    联调 :crit, after d2, 3d
    上线 :milestone, m1, 2026-11-20, 0d`;

test("gantt: dates, durations, after and tags", () => {
  const { title, sections, tasks } = parseGantt(GANTT);
  assert.equal(title, "计划");
  assert.deepEqual(sections, ["设计", "开发"]);
  assert.deepEqual(tasks.map((t) => [t.name, iso(t.start), iso(t.end), t.tags]), [
    ["评审", "2026-11-02", "2026-11-06", ["done"]],
    ["原型", "2026-11-06", "2026-11-11", []],
    ["后端", "2026-11-10", "2026-11-24", ["active"]],
    ["联调", "2026-11-11", "2026-11-14", ["crit"]],
    ["上线", "2026-11-20", "2026-11-20", ["milestone"]],
  ]);
});

test("gantt: a task with only a duration starts when the previous one ends", () => {
  const { tasks } = parseGantt("gantt\n dateFormat YYYY-MM-DD\n a :2026-11-01, 2d\n b :3d");
  assert.equal(iso(tasks[1].start), "2026-11-03");
  assert.equal(iso(tasks[1].end), "2026-11-06");
});

test("gantt: draws one bar per task and a diamond per milestone", () => {
  const svg = renderGanttSvg(GANTT, light);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.equal((svg.match(/<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="22"/g) || []).length, 4);
  assert.equal((svg.match(/<path d="M[\d.]+,[\d.]+L/g) || []).length, 1);
  assert.match(svg, />计划</);
});

test("gantt: unsupported formats and unknown ids fail readably", () => {
  assert.throws(() => parseGantt("gantt\n dateFormat DD/MM/YYYY\n a :2026-11-01, 2d"), /只支持 dateFormat YYYY-MM-DD/);
  assert.throws(() => parseGantt("gantt\n dateFormat YYYY-MM-DD\n a :after zz, 2d"), /找不到这个任务 id/);
  assert.throws(() => parseGantt("gantt\n dateFormat YYYY-MM-DD\n a :3d"), /缺少开始日期/);
  assert.throws(() => parseGantt("gantt\n dateFormat YYYY-MM-DD\n a :x, y, z"), /无法解析/);
});

test("pie: title, showData and quoted or bare labels", () => {
  const o = parsePie('pie showData title 占比\n  "文档" : 40\n  代码 : 30');
  assert.deepEqual(o.title, { text: "占比" });
  assert.deepEqual(o.series[0].data, [{ name: "文档", value: 40 }, { name: "代码", value: 30 }]);
  assert.deepEqual(parsePie("pie\n title 单独一行\n \"a\" : 1").title, { text: "单独一行" });
  assert.throws(() => parsePie("pie\n oops"), /无法解析饼图/);
});

test("dispatcher: routes by diagram type and rejects the rest", () => {
  assert.match(renderMermaidSvg("graph LR\n A-->B", light), /^<svg/);
  assert.match(renderMermaidSvg("sequenceDiagram\n A->>B: hi", light), /^<svg/);
  assert.match(renderMermaidSvg('pie\n "a" : 1\n "b" : 2', light), /a 33\.3%/);
  assert.match(renderMermaidSvg("gantt\n dateFormat YYYY-MM-DD\n a :2026-11-01, 2d", light), /^<svg/);
  assert.throws(() => renderMermaidSvg("classDiagram\n A <|-- B", light), /流程图、序列图、饼图和甘特图/);
});
