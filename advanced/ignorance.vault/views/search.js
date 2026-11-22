const sdk = window.typora.view;
const input = document.querySelector("#query");
const matches = document.querySelector("#matches");
let context;
let sequence = 0;
let pending;
let changeTimer;
let showing;
let updates = Promise.resolve();

function show(response) {
  matches.replaceChildren();
  if (response.message || !response.results?.length) {
    matches.textContent = response.message ?? "没有匹配的文件";
    return;
  }
  for (const result of response.results) {
    const entry = document.createElement("section");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = result.name;
    const path = document.createElement("code");
    path.className = "file-path";
    path.textContent = result.path;
    path.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      path.hidden = !path.hidden;
      toggle.setAttribute("aria-expanded", String(!path.hidden));
    });
    entry.append(toggle, path);
    if (result.heading) {
      const heading = document.createElement("p");
      heading.textContent = result.heading;
      entry.append(heading);
    }
    const snippet = document.createElement("p");
    for (const fragment of result.snippet) {
      if (fragment.match) {
        const mark = document.createElement("mark");
        mark.textContent = fragment.text;
        snippet.append(mark);
      } else snippet.append(fragment.text);
    }
    entry.append(snippet);
    matches.append(entry);
  }
}

function enqueue() {
  clearTimeout(changeTimer);
  pending = undefined;
  if (!input.value.trim()) { matches.replaceChildren(); return; }
  if (!context) { matches.textContent = "请打开工作区文档"; return; }
  const key = context;
  const request = { query: input.value.trim().slice(0, 300), at: Date.now(), id: `${Date.now()}-${++sequence}` };
  pending = request.id;
  changeTimer = setTimeout(() => {
    updates = updates.catch(() => {}).then(async () => {
      const previous = await sdk.storage.get("search-requests") ?? {};
      const active = Object.entries(previous).filter(([id, saved]) => id !== key && Date.now() - saved.at < 20_000).slice(-3);
      await sdk.storage.set("search-requests", Object.fromEntries([...active, [key, request]]));
    }).catch((error) => { matches.textContent = "无法提交搜索"; sdk.log(error.message); });
  }, 45);
}

async function poll() {
  if (!context || !pending) return;
  const result = (await sdk.storage.get("search-responses"))?.[context];
  if (result?.id !== pending) return;
  const signature = JSON.stringify(result);
  if (signature !== showing) {
    showing = signature;
    show(result);
  }
}

sdk.onDocument(({ blocks }) => {
  const next = blocks[0]?.id;
  if (next !== context) {
    context = next;
    enqueue();
  }
});
input.addEventListener("input", enqueue);
setInterval(() => { void poll().catch(() => {}); }, 65);
