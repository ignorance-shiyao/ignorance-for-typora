import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../advanced/ignorance.flashcards/core/parse.js";
import { buildCards, noteCards, reviewQueue, recordRating, scheduleCard, pruneReviews } from "../advanced/ignorance.flashcards/index/review.js";

test("recognizes three card formats and distinguishes matching questions by path", async () => {
  const source = "要点 :: 答案\n\n为何？\n?\n因为甲\n还有乙\n\n核对 ==答案== #flashcard\n\n```md\n伪造 :: 忽略\n```";
  const first = parseVaultNote("学习/甲.md", source);
  const second = parseVaultNote("学习/乙.md", "要点 :: 答案\n\n普通 ==高亮==");
  const cards = await buildCards([first, second]);
  assert.equal(cards.length, 4);
  assert.deepEqual(noteCards(first).map(({ answer }) => answer), ["答案", "因为甲\n还有乙", "答案"]);
  assert.notEqual(cards[0].id, cards[3].id);
  assert.equal(noteCards(second).length, 1);
});

test("SM-2 intervals follow 1, 6 and ease multiplication, then reset on failure", () => {
  let record;
  const scores = [4, 4, 5, 2, 4];
  const dates = ["2026-11-22", "2026-11-23", "2026-11-29", "2026-12-15", "2026-12-16"];
  const intervals = scores.map((quality, index) => {
    record = scheduleCard(record, quality, dates[index]);
    return record.interval;
  });
  assert.deepEqual(intervals, [1, 6, 16, 1, 1]);
  assert.equal(record.due, "2026-12-17");
});

test("rejects duplicate or stale scores while pruning deleted cards", async () => {
  const [card] = await buildCards([parseVaultNote("甲.md", "问题 :: 答案")]);
  const day = "2026-11-22";
  const first = recordRating({}, card.id, 0, 4, day);
  assert.equal(first.updated, true);
  const duplicate = recordRating(first.records, card.id, 0, 4, day);
  assert.equal(duplicate.updated, false);
  assert.deepEqual(duplicate.records, first.records);
  assert.equal(reviewQueue([card], first.records, day).reviewedToday, 1);
  assert.equal(reviewQueue([card], first.records, day).due, 0);
  assert.deepEqual(pruneReviews(first.records, []), {});
});
