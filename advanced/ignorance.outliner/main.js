import { registerOutlinerCommands } from "./format/outliner-commands.js";

export async function activate(ctx) {
  registerOutlinerCommands(typora, ctx.subscriptions);
}
