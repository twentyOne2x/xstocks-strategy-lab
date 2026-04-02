import type { HandlerResult } from "./_base.js";
export async function execute(config: Record<string, unknown>, inputs: Record<string, unknown>): Promise<HandlerResult> {
  await delay(100);
  const field = String(config.field ?? "");
  const operator = String(config.operator ?? "==");
  const target = config.value;
  const actual = field.split(".").reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], inputs);
  let result = false;
  if (operator === "==") result = String(actual) === String(target);
  else if (operator === "!=") result = String(actual) !== String(target);
  else if (operator === ">") result = Number(actual) > Number(target);
  else if (operator === "<") result = Number(actual) < Number(target);
  else if (operator === "contains") result = String(actual).includes(String(target));
  return { output: { result, field, operator, actual, target } };
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
