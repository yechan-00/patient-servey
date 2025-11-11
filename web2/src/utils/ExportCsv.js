// web2/src/utils/ExportCsv.js
// CSV 내보내기 유틸 (named + default export 동시 제공)
function exportCsvImpl({ filename, rows, columns }) {
  const header = columns.map((c) => escapeCsv(c.label)).join(",") + "\n";
  const body = rows
    .map((r) => columns.map((c) => escapeCsv(valueToText(r[c.key]))).join(","))
    .join("\n");
  const csv = header + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "export.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(val) {
  const s = String(val ?? "");
  // 따옴표/쉼표/개행 포함 시 CSV 규격에 맞게 감싸기
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function valueToText(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v;
}

// named export
export const exportCsv = exportCsvImpl;
// default export (호환성)
export default exportCsvImpl;

