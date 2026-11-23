import { buildCards, pruneReviews, recordRating, reviewQueue } from "./review.js";
import { localToday } from "./query.js";

const REQUEST_PREFIX = "review-request-";
const RESPONSE_KEY = "review-responses";
const ALARM = "review-reminder";
const TIMEOUT = 60_000;
const REQUESTS_PER_TICK = 16;
const HISTORY_DAYS = 366;

export function createReview(api, index, subscriptions) {
  let prepared;
  let polling = false;
  let disposed = false;

  async function prepare(state) {
    if (prepared && prepared.revision === state.revision && prepared.scope === state.scope) return prepared.promise;
    const promise = buildCards(state.records).then((cards) => ({ cards, byId: new Map(cards.map((card) => [card.id, card])) }));
    prepared = { scope: state.scope, revision: state.revision, promise };
    return promise;
  }

  async function model(state) {
    const { cards } = await prepare(state);
    const stored = (await api.storage.get(state.scope + "-review")) ?? {};
    const today = localToday();
    const queue = reviewQueue(cards, stored.records ?? {}, today, Object.keys(stored.history ?? {}));
    return { ...queue, reviewedToday: stored.history?.[today] ?? queue.reviewedToday, scope: state.scope };
  }

  async function score(state, request) {
    const { byId } = await prepare(state);
    const today = localToday();
    if (!byId.has(request.card) || ![0, 2, 4, 5].includes(request.quality)) return "卡片已更新";
    let changed = false;
    await api.storage.update(state.scope + "-review", (current) => {
      const safe = current ?? {};
      const result = recordRating(safe.records ?? {}, request.card, request.version, request.quality, today);
      changed = result.updated;
      if (!changed) return safe;
      const history = { ...safe.history, [today]: (safe.history?.[today] ?? 0) + 1 };
      const recent = Object.entries(history).sort(([a], [b]) => b.localeCompare(a)).slice(0, HISTORY_DAYS);
      return { ...safe, records: result.records, history: Object.fromEntries(recent) };
    });
    return changed ? "" : "这张卡片已在其他窗口复习";
  }

  async function poll() {
    if (polling || disposed) return;
    polling = true;
    try {
      const keys = (await api.storage.keys()).filter((key) => key.startsWith(REQUEST_PREFIX));
      if (!keys.length) return;
      const state = await index.state();
      let handled = 0;
      for (const key of keys) {
        if (handled >= REQUESTS_PER_TICK) break;
        const queued = await api.storage.get(key);
        if (!queued) continue;
        if (Date.now() - queued.at <= TIMEOUT && (state.status !== "ready" || state.scope !== queued.scope)) continue;
        await api.runtime.lock(key, async () => {
          const request = await api.storage.get(key);
          if (!request || Date.now() - request.at > TIMEOUT) {
            await api.storage.remove(key);
            return;
          }
          if (state.status !== "ready" || state.scope !== request.scope) return;
          handled++;
          const error = await score(state, request);
          await api.storage.update(RESPONSE_KEY, (previous) => {
            const active = Object.entries(previous ?? {}).filter(([id, item]) => id !== key && Date.now() - item.at < TIMEOUT).slice(-15);
            return Object.fromEntries([...active, [key, { error, at: Date.now() }]]);
          });
          await api.storage.remove(key);
        });
      }
    } finally {
      polling = false;
    }
  }

  async function prune(state) {
    if (state.status !== "ready") return;
    const { cards } = await prepare(state);
    await api.storage.update(state.scope + "-review", (previous) => {
      if (!previous) return {};
      return { ...previous, records: pruneReviews(previous.records ?? {}, cards) };
    });
  }

  async function remind() {
    if (api.settings.get("reviewReminders") === false) return;
    const state = await index.state({ start: false });
    if (state.status !== "ready") return;
    const queue = await model(state);
    if (!queue.due) return;
    const today = localToday();
    let show = false;
    await api.storage.update(state.scope + "-review", (previous) => {
      show = previous?.reminded !== today;
      return show ? { ...previous, reminded: today } : previous;
    });
    if (show) await api.ui.toast(`今天有 ${queue.due} 张卡片到期`);
  }

  const report = (error) => api.ui.toast(`复习数据更新失败：${error.message}`);
  if (api.alarms?.onAlarm) {
    subscriptions.push(api.alarms.onAlarm(({ name }) => {
      if (name === ALARM) void remind().catch(report);
    }));
    void api.alarms.create(ALARM, { periodInMinutes: 60 }).catch(report);
  }
  const timer = setInterval(() => void poll().catch(report), 400);
  subscriptions.push({ dispose() { disposed = true; clearInterval(timer); } });
  return { model, prune };
}
