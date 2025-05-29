/**
 * A tagged template literal for SQL strings to allow for formatting and syntax
 * highlighting
 */
export function sql(strings: TemplateStringsArray, ...expr: unknown[]) {
  return strings.map((str, index) => str + (expr.length > index ? String(expr[index]) : "")).join("");
}
