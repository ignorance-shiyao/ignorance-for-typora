let reviewContext;
let reviewModel;
let flipped = false;
let inFlight;
let feedback = "";

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
  inFlight = { key, at: Date.now(), card: card.id, version: card.version };
  feedback = "";
  showReview(reviewModel);
  try {
    await sdk.storage.set(key, { card: card.id, version: card.version, quality, scope: reviewModel.scope, at: Date.now() });
  } catch (error) {
    inFlight = undefined;
    feedback = "无法保存评分";
    sdk.log(error.message);
    showReview(reviewModel);
  }
}

async function readReview() {
  const context = reviewContext;
  if (!context) return;
  const data = (await sdk.storage.get("detail-contexts"))?.[context]?.review;
  if (context !== reviewContext) return;
  let changed = JSON.stringify(data) !== JSON.stringify(reviewModel);
  if (inFlight) {
    const response = (await sdk.storage.get("review-responses"))?.[inFlight.key];
    const advanced = data?.next?.id !== inFlight.card || data?.next?.version !== inFlight.version;
    if ((response && (response.error || advanced)) || Date.now() - inFlight.at > 12_000) {
      feedback = response?.error || (response ? "" : "评分暂未确认");
      if (advanced) flipped = false;
      inFlight = undefined;
      changed = true;
    }
  }
  if (data?.next?.id !== reviewModel?.next?.id) flipped = false;
  reviewModel = data;
  if (changed) showReview(data);
}

sdk.onDocument(({ blocks }) => {
  reviewContext = blocks[0]?.id;
  void readReview().catch(() => {});
});
setInterval(() => { void readReview().catch(() => {}); }, 550);
