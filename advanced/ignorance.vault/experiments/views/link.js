const view = window.typora.view;

const status = document.querySelector("#result");
view.onMessage((message) => { status.textContent = String(message); });
document.querySelector("#open").addEventListener("click", () => view.postMessage("open"));
view.onSnapshot(() => ({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="24"><text x="0" y="18">文件跳转验证</text></svg>' }));
