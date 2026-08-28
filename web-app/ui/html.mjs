export function escapeHtml(value, { escapeSingleQuote = true } = {}) {
  const escaped = String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return escapeSingleQuote ? escaped.replaceAll("'", "&#039;") : escaped;
}
