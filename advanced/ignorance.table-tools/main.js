import { registerTableCommands } from "./format/table-commands.js";

export async function activate(ctx) {
  registerTableCommands(typora, ctx.subscriptions);
}
