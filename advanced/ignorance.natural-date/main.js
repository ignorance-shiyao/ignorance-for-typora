import { registerDateCommands } from "./format/date-commands.js";

export async function activate(ctx) {
  registerDateCommands(typora, ctx.subscriptions);
}
