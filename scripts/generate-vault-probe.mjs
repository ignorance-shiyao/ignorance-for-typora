import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const total = Number(process.argv[2]);
if (![6, 1000, 2001, 3000, 5000, 5001].includes(total)) {
  console.error("用法：node scripts/generate-vault-probe.mjs 6|1000|2001|3000|5000|5001");
  process.exitCode = 1;
} else {
  const sandbox = await mkdtemp(join(tmpdir(), "typora-vault-probe-"));
  const root = join(sandbox, `vault-probe-${total}`);
  await mkdir(root);
  if (total === 6) {
    const notes = {
      "项目/星河.md": "# 星河\n\n[[云岭]] [[云岭#计划]] [[云岭|项目别名]] [[未建笔记]] [[星河]]\n",
      "项目/云岭.md": "# 计划\n\n[回到星河](./星河.md)\n",
      "项目/评审.md": "# 评审\n\n[[星河]]\n",
      "资料/云岭.md": "# 资料云岭\n",
      "资料/记录.md": "# 记录\n\n[[云岭]]\n",
      "孤立.md": "# 孤立\n",
    };
    await mkdir(join(root, "项目"));
    await mkdir(join(root, "资料"));
    await Promise.all(Object.entries(notes).map(([path, markdown]) => writeFile(join(root, path), markdown)));
  } else {
    const intro = total === 2001 ? "# 大工作区图谱\n\n[[目标]]\n" : "# 工作区扩展验证\n\n```vault-probe-static\nfiles\n```\n\n```vault-probe-link\n目标.md\n```\n";
    await writeFile(join(root, "00-验证.md"), intro);
    await writeFile(join(root, "目标.md"), "# 跳转成功\n");
    for (let base = 0; base < total - 2; base += 100) {
      const folder = join(root, `group-${String(base).padStart(4, "0")}`);
      await mkdir(folder);
      const count = Math.min(100, total - 2 - base);
      await Promise.all(Array.from({ length: count }, (_, offset) => {
        const id = base + offset;
        const link = total === 2001 ? `[[${(id + 1) % (total - 2)}]]` : "[[目标]]";
        return writeFile(join(folder, `${id}.md`),
          `---\ntopic: 示例\nscore: ${id}\n---\n\n# 测试笔记 ${id}\n\n- [ ] 示例任务\n\n合成正文 ${link}\n`);
      }));
    }
  }
  console.log(root);
}
