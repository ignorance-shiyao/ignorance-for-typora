const result = document.querySelector("#result");
async function read() {
  result.textContent = (await view.storage.get("vault-probe-token")) ?? "没有验证值";
}
document.querySelector("#read").addEventListener("click", read);
void read();
