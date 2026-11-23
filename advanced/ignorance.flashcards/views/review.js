const sdk = window.typora.view;
const output = document.querySelector("#output");

function element(tag, text) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  return node;
}

function pathValue(text, path) {
  const display = element("span");
  const button = element("button", text);
  const value = element("code", path);
  value.className = "file-path";
  value.hidden = true;
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    value.hidden = !value.hidden;
    button.setAttribute("aria-expanded", String(!value.hidden));
  });
  display.append(button, value);
  return display;
}

let reviewContext;
let reviewModel;
let flipped = false;
let inFlight;
let feedback = "";
let readVersion = 0;
let announcedContext;
let validUntil = 0;
let reading;

function showReview(model) {
  output.replaceChildren();
  if (!model) {
    output.textContent = "正在建立索引";
    return;
  }
  output.append(element("p", `到期 ${model.due} · 已复习 ${model.reviewedToday} · 连续 ${model.streak} 天`));
  if (!model.next) {
    output.append(element("p", "没有到期卡片"));
  } else {
    const { next } = model;
    const question = element("p", next.question);
    question.className = "review-text";
    output.append(question, pathValue(next.name, next.path));
    if (flipped) {
      const answer = element("p", next.answer);
      answer.className = "review-text";
      output.append(answer);
      const options = element("div");
      options.className = "review-actions";
      for (const [label, quality] of [["忘了", 0], ["模糊", 2], ["记得", 4], ["简单", 5]]) {
        const button = element("button", label);
        button.type = "button";
        button.disabled = Boolean(inFlight);
        button.addEventListener("click", () => void submitRating(quality));
        options.append(button);
      }
      output.append(options);
    } else {
      const flip = element("button", "翻面");
      flip.type = "button";
      flip.addEventListener("click", () => { flipped = true; showReview(model); });
      output.append(flip);
    }
  }
  if (feedback || inFlight) output.append(element("p", feedback || "正在保存评分"));
  const heading = element("h3", "未来 7 天");
  const list = element("ul");
  for (const day of model.upcoming) list.append(element("li", `${day.date} · ${day.count} 张`));
  output.append(heading, list);
}

async function submitRating(quality) {
  if (inFlight || !reviewModel?.next) return;
  const card = reviewModel.next;
  const nonce = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const key = `review-request-${Date.now()}-${nonce}`;
  const scope = reviewModel.scope;
  const request = { key, at: Date.now(), card: card.id, version: card.version, scope };
  inFlight = request;
  feedback = "";
  showReview(reviewModel);
  try {
    await sdk.storage.set(key, { card: card.id, version: card.version, quality, scope, at: request.at });
  } catch (error) {
    if (inFlight !== request) return;
    inFlight = undefined;
    feedback = "无法保存评分";
    sdk.log(error.message);
    showReview(reviewModel);
  }
}

async function readReview() {
  const context = reviewContext;
  if (!context || document.hidden) return;
  const now = Date.now();
  if (announcedContext !== context || validUntil - now < 4000) {
    const entry = await sdk.storage.get("review-demand") ?? {};
    const active = Object.entries(entry).filter(([, expires]) => expires > now);
    const expiration = now + 8000;
    await sdk.storage.set("review-demand", { ...Object.fromEntries(active), [context]: expiration });
    announcedContext = context;
    validUntil = expiration;
  }
  const version = ++readVersion;
  const stored = (await sdk.storage.get("detail-contexts"))?.[context];
  if (version !== readVersion || context !== reviewContext) return;
  if (stored?.message || stored?.status === "no-workspace") {
    reviewModel = undefined;
    output.textContent = stored.message ?? "请先打开工作区文件夹";
    return;
  }
  const data = stored?.review;
  let changed = JSON.stringify(data) !== JSON.stringify(reviewModel);
  const pending = inFlight;
  if (pending && data && pending.scope === data.scope) {
    const response = (await sdk.storage.get("review-responses"))?.[pending.key];
    if (version !== readVersion || context !== reviewContext || inFlight !== pending) return;
    const advanced = data.next?.id !== pending.card || data.next?.version !== pending.version;
    if ((response && (response.error || advanced)) || Date.now() - pending.at > 12_000) {
      feedback = response?.error || (response ? "" : "评分暂未确认");
      if (advanced) flipped = false;
      inFlight = undefined;
      changed = true;
    }
  }
  if (data && pending && pending.scope !== data.scope) {
    inFlight = undefined;
    feedback = "";
  }
  if (data?.next?.id !== reviewModel?.next?.id) flipped = false;
  reviewModel = data;
  if (changed) showReview(data);
}

function refresh() {
  if (!reading) {
    reading = readReview().catch(() => {
      output.textContent = "无法读取复习记录";
    }).finally(() => { reading = undefined; });
  }
}

sdk.onDocument(({ blocks }) => {
  reviewContext = blocks[0]?.id;
  if (!reviewContext) {
    reviewModel = undefined;
    output.textContent = "请先打开文档";
  }
  refresh();
});
const retry = setInterval(refresh, 550);
document.addEventListener("visibilitychange", refresh);
window.addEventListener("pagehide", ({ persisted }) => {
  if (!persisted) clearInterval(retry);
});
