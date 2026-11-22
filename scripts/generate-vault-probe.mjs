import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const total = Number(process.argv[2]);
if (![1000, 3000, 5000].includes(total)) {
  console.error("用法：node scripts/generate-vault-probe.mjs 1000|3000|5000");
  process.exitCode = 1;
} else {
  const sandbox = await mkdtemp(join(tmpdir(), "typora-vault-probe-"));
  const root = join(sandbox, `vault-probe-${total}`);
  await mkdir(root);
  await writeFile(join(root, "00-验证.md"), "# 工作区扩展验证\n\n```vault-probe-static\nfiles\n```\n\n```vault-probe-link\n目标.md\n```\n");
  await writeFile(join(root, "目标.md"), "# 跳转成功\n");
  for (let base = 0; base < total - 2; base += 100) {
    const folder = join(root, `group-${String(base).padStart(4, "0")}`);
    await mkdir(folder);
    const count = Math.min(100, total - 2 - base);
    await Promise.all(Array.from({ length: count }, (_, offset) => {
      const id = base + offset;
      return writeFile(join(folder, `${id}.md`),
        `---\ntopic: 示例\nscore: ${id}\n---\n\n# 测试笔记 ${id}\n\n- [ ] 示例任务\n\n合成正文 [[目标]]\n`);
    }));
  }
  console.log(root);
}
