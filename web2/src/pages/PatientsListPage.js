// web2/src/pages/PatientsListPage.js
import React, { useEffect, useMemo, useState } from "react";
import exportCsv from "../utils/ExportCsv";
import "./../styles/Print.css";
import { getPatientsLite } from "../utils/FirebaseUtils";

const columns = [
  { key: "name", label: "이름" },
  { key: "birthDate", label: "생년월일" },
  { key: "cancerType", label: "암종" },
  { key: "diagnosisDate", label: "진단일" },
  { key: "riskLevel", label: "위험도" },
  { key: "counselingStatus", label: "상담 상태" },
];

export default function PatientsListPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL"); // 상담 상태 필터
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPatientsLite({ includeArchived });
        if (!alive) return;
        setRows(data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [includeArchived]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      const text = `${r.name ?? ""} ${r.cancerType ?? ""} ${
        r.riskLevel ?? ""
      } ${r.counselingStatus ?? ""}`.toLowerCase();
      const matchQ = qLower ? text.includes(qLower) : true;
      const matchStatus =
        status === "ALL" ? true : (r.counselingStatus || "") === status;
      return matchQ && matchStatus;
    });
  }, [rows, q, status]);

  const handleExport = () => {
    exportCsv({
      filename: `patients_list_${new Date().toISOString().slice(0, 10)}.csv`,
      rows: filtered,
      columns,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container print-safe">
      <div className="toolbar no-print">
        <h2>간단 환자 리스트</h2>
        <div className="toolbar-actions">
          <input
            type="text"
            placeholder="검색: 이름/암종/위험도/상담상태"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">상담 상태: 전체</option>
            <option value="미요청">미요청</option>
            <option value="요청">요청</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="보관">보관</option>
          </select>
          <label
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            보관 포함
          </label>
          <button onClick={handleExport}>CSV 다운로드</button>
          <button onClick={handlePrint}>프린트</button>
        </div>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div className="table-wrap">
          <table className="patients-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: "center" }}>
                    결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id || `${r.name}-${r.birthDate}-${r.diagnosisDate}`}
                  >
                    {columns.map((c) => (
                      <td key={c.key}>{r[c.key] ?? "-"}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
