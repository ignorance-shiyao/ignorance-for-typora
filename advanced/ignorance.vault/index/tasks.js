import { calendarDate, compareValue, dayOffset, localToday, parseSource, queryError, readOptions, sourceIncludes } from "./query.js";

const priorities = { high: 0, medium: 1, low: 2 };
const priorityLabels = { high: "高", medium: "中", low: "低" };

function choice(options, key, values, fallback) {
  const option = options.get(key);
  if (!option) return fallback;
  if (!values.includes(option.value)) throw queryError(option.line, `${key} 可用 ${values.join("、")}`);
  return option.value;
}

function duePredicate(option) {
  if (!option) return () => true;
  const { value, line } = option;
  switch (value) {
    case "overdue": return (date, today) => Boolean(date && date < today);
    case "today": return (date, today) => date === today;
    case "week":
    case "this-week": return (date, today) => Boolean(date && date >= today && date <= dayOffset(today, 6));
    case "none": return (date) => !date;
  }
  const relative = /^(before|after|on)\s+today(?:\s*([+-])\s*(\d+)d)?$/.exec(value);
  const explicit = /^(before|after|on)\s+(\d{4}-\d{2}-\d{2})$/.exec(value);
  if (!relative && !calendarDate(explicit?.[2])) throw queryError(line, "due 需要日期条件、overdue、today、this-week 或 none");
  const operator = relative?.[1] ?? explicit[1];
  return (date, today) => {
    if (!date) return false;
    const limit = relative ? dayOffset(today, Number(relative[3] ?? 0) * (relative[2] === "-" ? -1 : 1)) : explicit[2];
    return operator === "before" ? date < limit : operator === "after" ? date > limit : date === limit;
  };
}

export function parseTaskQuery(source) {
  const options = readOptions(source, ["from", "status", "due", "tag", "group", "sort"]);
  return {
    source: parseSource(options.get("from")),
    status: choice(options, "status", ["open", "done", "all"], "all"),
    due: duePredicate(options.get("due")),
    tag: options.get("tag")?.value.replace(/^#/, ""),
    group: choice(options, "group", ["none", "file", "due", "priority"], "none"),
    sort: choice(options, "sort", ["due", "file", "priority"], "due"),
  };
}

export function runTasks(query, notes, today = localToday()) {
  const rows = [];
  for (const note of notes) {
    if (!sourceIncludes(query.source, note)) continue;
    for (const task of note.tasks) {
      if (query.status !== "all" && (query.status === "done") !== task.completed) continue;
      if (query.tag && !task.tags.includes(query.tag) && !note.tags.includes(query.tag)) continue;
      const due = calendarDate(task.due);
      if (query.due(due, today)) rows.push({ task, note, due });
    }
  }
  rows.sort((left, right) => {
    const overdue = ({ due, task }) => !task.completed && Boolean(due && due < today);
    const overdueRank = Number(overdue(right)) - Number(overdue(left));
    if (overdueRank) return overdueRank;
    if (query.sort === "file") return compareValue(left.note.path, right.note.path);
    if (query.sort === "priority") {
      return (priorities[left.task.priority] ?? 3) - (priorities[right.task.priority] ?? 3);
    }
    return compareValue(left.due ?? "9999-12-31", right.due ?? "9999-12-31");
  });
  const groups = new Map();
  for (const { note, task, due } of rows) {
    const priority = priorityLabels[task.priority] ?? "";
    const label = query.group === "file" ? note.path : query.group === "due" ? due ?? "无截止日期"
      : query.group === "priority" ? priority || "无优先级" : "";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({ path: note.path, cells: [
      note.name, `${task.completed ? "已完成" : "待完成"} ${task.text}`.trimEnd(), due ?? "", priority,
    ] });
  }
  return { view: "table", columns: ["文件", "任务", "截止日期", "优先级"], count: rows.length,
    groups: Array.from(groups, ([label, items]) => ({ label, rows: items })) };
}

const WEEK = parseTaskQuery("status: open\ndue: this-week\nsort: due");
export function weekTasks(notes, today) {
  return runTasks(WEEK, notes, today);
}
