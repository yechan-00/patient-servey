// src/pages/ArchivedPatientsPage.js
import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { subscribePatients, setPatientArchived } from "../utils/FirebaseUtils";
import { deletePatientWithCascade } from "../utils/cascadeDelete";
import { Link, useNavigate } from "react-router-dom";

const Section = styled.div`
  padding: ${({ theme }) => theme.spacing?.lg || "24px"};
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#e5e7eb"};
  border-radius: ${({ theme }) => theme.borderRadius?.medium || "12px"};
  box-shadow: ${({ theme }) =>
    theme.shadows?.card || "0 1px 2px rgba(0,0,0,0.04)"};
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing?.md || "16px"};
  border-bottom: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#e5e7eb"};
`;

const CardTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSize?.lg || "18px"};
  margin: 0;
  font-weight: 700;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing?.sm || "8px"};
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing?.xs || "6px"};
  align-items: center;
`;

const TextInput = styled.input`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing?.sm || "8px"};
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#d0d7de"};
  border-radius: ${({ theme }) => theme.borderRadius?.small || "8px"};
`;

const Select = styled.select`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing?.sm || "8px"};
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#d0d7de"};
  border-radius: ${({ theme }) => theme.borderRadius?.small || "8px"};
`;

const OutlineButton = styled.button`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing?.sm || "10px"};
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#d0d7de"};
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius?.small || "8px"};
  cursor: pointer;
  font-weight: 600;
  &:hover {
    background: ${({ theme }) =>
      theme.colors?.neutral?.lighterGrey || "#f6f8fa"};
  }
`;

const DangerButton = styled(OutlineButton)`
  border-color: #dc3545;
  color: #dc3545;
  background: #fff5f5;
  &:hover {
    background: #ffe9ea;
  }
`;

const TableWrapper = styled.div`
  max-height: 60vh;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const StickyThead = styled.thead`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors?.neutral?.lighterGrey || "#f8fafc"};
  z-index: 1;
`;

const Th = styled.th`
  text-align: left;
  font-weight: 700;
  padding: ${({ theme }) => theme.spacing?.sm || "10px"};
  font-size: ${({ theme }) => theme.fontSize?.sm || "14px"};
  color: ${({ theme }) => theme.colors?.neutral?.darkerGrey || "#111"};
  border-bottom: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#e5e7eb"};
  position: sticky;
  top: 0;
`;

const Tr = styled.tr`
  &:hover td {
    background: ${({ theme }) =>
      theme.colors?.neutral?.lightestGrey || "#fafbfc"};
  }
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing?.sm || "10px"};
  font-size: ${({ theme }) => theme.fontSize?.sm || "14px"};
  border-bottom: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#f2f3f5"};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing?.xs || "8px"};
`;

const RiskBadge = styled.span`
  display: inline-block;
  min-width: 44px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize?.xs || "12px"};
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  background: ${({ level }) =>
    level === "high" ? "#d32f2f" : level === "medium" ? "#f57c00" : "#388e3c"};
`;

// ===== Dashboard-like stats & charts =====
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing?.md || "16px"};
  margin-bottom: ${({ theme }) => theme.spacing?.lg || "24px"};
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#e5e7eb"};
  border-radius: ${({ theme }) => theme.borderRadius?.medium || "12px"};
  box-shadow: ${({ theme }) =>
    theme.shadows?.card || "0 1px 2px rgba(0,0,0,0.04)"};
  padding: ${({ theme }) => theme.spacing?.md || "16px"};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors?.neutral?.grey || "#6b7280"};
  font-size: ${({ theme }) => theme.fontSize?.xs || "12px"};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize?.xl || "22px"};
  font-weight: 700;
`;

const ChartRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing?.md || "16px"};
  margin-top: ${({ theme }) => theme.spacing?.lg || "24px"};
`;

const ChartCard = styled.div`
  background: #fff;
  border: 1px solid
    ${({ theme }) => theme.colors?.neutral?.lightGrey || "#e5e7eb"};
  border-radius: ${({ theme }) => theme.borderRadius?.medium || "12px"};
  box-shadow: ${({ theme }) =>
    theme.shadows?.card || "0 1px 2px rgba(0,0,0,0.04)"};
  padding: ${({ theme }) => theme.spacing?.md || "16px"};
`;

const ChartTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: ${({ theme }) => theme.fontSize?.md || "16px"};
  font-weight: 700;
`;

// Simple bar for distribution (no external deps)
const Bar = styled.div`
  height: 10px;
  background: ${({ color }) => color || "#3b82f6"};
  border-radius: 999px;
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  font-size: ${({ theme }) => theme.fontSize?.sm || "14px"};
`;

const LegendDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  margin-right: 6px;
  background: ${({ color }) => color || "#3b82f6"};
`;

export default function ArchivedPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent | name | risk

  const [riskFilter, setRiskFilter] = useState("all"); // all | low | medium | high
  const [cancerFilter, setCancerFilter] = useState("all");

  // 색 토큰(대시보드 톤) 정의
  const primaryBlue = "#1e3a8a"; // 어두운 푸른색 톤
  const midBlue = "#3b82f6";
  const warnOrange = "#f59e0b";
  const dangerRed = "#ef4444";
  const okGreen = "#10b981";

  // Timestamp(Firestore) 또는 문자열을 YYYY-MM-DD로 표시
  const formatDate = (v) => {
    if (!v) return "-";
    try {
      if (typeof v === "string") {
        // 이미 YYYY-MM 또는 YYYY-MM-DD 형태라면 그대로 사용
        return v.length >= 10 ? v.slice(0, 10) : v;
      }
      if (typeof v === "object") {
        // Firestore Timestamp 대응
        const ms = v.seconds
          ? v.seconds * 1000
          : v.toMillis
          ? v.toMillis()
          : NaN;
        if (!isNaN(ms)) {
          const d = new Date(ms);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${d.getFullYear()}-${mm}-${dd}`;
        }
      }
    } catch (e) {}
    return "-";
  };

  // 보관일 후보: archivedAt > updatedAt > lastSurveyAt
  const getArchivedDate = (p) =>
    p.archivedAt || p.updatedAt || p.lastSurveyAt || null;

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    const total = patients.length;
    const high = patients.filter((p) => p.riskLevel === "high").length;
    const recent30 = patients.filter((p) => {
      const d = getArchivedDate(p);
      const ms = d?.seconds
        ? d.seconds * 1000
        : typeof d === "string"
        ? Date.parse(d)
        : 0;
      return ms && Date.now() - ms <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const restorable = total; // 현재는 모두 복귀 가능으로 가정

    // 암종류 분포
    const byCancer = {};
    patients.forEach((p) => {
      const key = p.cancerType || "기타/미입력";
      byCancer[key] = (byCancer[key] || 0) + 1;
    });

    // 위험도 분포
    const byRisk = { low: 0, medium: 0, high: 0 };
    patients.forEach((p) => {
      if (byRisk[p.riskLevel] !== undefined) byRisk[p.riskLevel]++;
    });

    const maxCancer = Math.max(1, ...Object.values(byCancer));
    const maxRisk = Math.max(1, ...Object.values(byRisk));

    return {
      total,
      high,
      recent30,
      restorable,
      byCancer,
      byRisk,
      maxCancer,
      maxRisk,
    };
  }, [patients]);

  // 검색 + 정렬 적용된 리스트
  const displayedPatients = [...patients]
    .filter((p) => {
      // 검색
      if (searchTerm) {
        const name = (p.name || "").toLowerCase();
        const id = (p.id || "").toLowerCase();
        const q = searchTerm.toLowerCase();
        if (!(name.includes(q) || id.includes(q))) return false;
      }
      // 위험도 필터
      if (riskFilter !== "all" && p.riskLevel !== riskFilter) return false;
      // 암 종류 필터
      if (cancerFilter !== "all" && (p.cancerType || "")) {
        if ((p.cancerType || "") !== cancerFilter) return false;
      } else if (cancerFilter !== "all" && !p.cancerType) {
        // 미입력은 'all'에서만 허용
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "risk") {
        const order = { high: 3, medium: 2, low: 1 };
        return (order[b.riskLevel] || 0) - (order[a.riskLevel] || 0);
      }
      // recent: 보관일 최신순
      const da = getArchivedDate(a);
      const db = getArchivedDate(b);
      const ams = da?.seconds
        ? da.seconds * 1000
        : typeof da === "string"
        ? Date.parse(da)
        : 0;
      const bms = db?.seconds
        ? db.seconds * 1000
        : typeof db === "string"
        ? Date.parse(db)
        : 0;
      return (bms || 0) - (ams || 0);
    });

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribePatients({ showArchived: true }, (rows) => {
      const archivedOnly = rows.filter((p) => p.archived === true);
      setPatients(archivedOnly);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const handleUnarchive = async (id) => {
    try {
      await setPatientArchived(id, false);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("보관 해제 실패:", e);
      alert("보관 해제 중 문제가 발생했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "이 환자와 연관된 상담 요청/노트가 함께 삭제됩니다. 진행할까요?"
      )
    )
      return;
    try {
      await deletePatientWithCascade(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 중 문제가 발생했습니다.");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "id",
      "name",
      "birthDate",
      "cancerType",
      "diagnosisDate",
      "phone",
      "riskLevel",
      "archivedDate",
    ];
    const rows = displayedPatients.map((p) => [
      p.id,
      p.name || "",
      p.birthDate || "",
      p.cancerType || "",
      p.diagnosisDate || "",
      p.phone || "",
      p.riskLevel || "",
      formatDate(getArchivedDate(p)),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "archived_patients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section>
      <StatGrid>
        <StatCard>
          <StatLabel>보관 환자 수</StatLabel>
          <StatValue style={{ color: primaryBlue }}>{stats.total}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>고위험</StatLabel>
          <StatValue style={{ color: dangerRed }}>{stats.high}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>최근 30일 보관</StatLabel>
          <StatValue style={{ color: midBlue }}>{stats.recent30}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>복귀 가능</StatLabel>
          <StatValue style={{ color: okGreen }}>{stats.restorable}</StatValue>
        </StatCard>
      </StatGrid>
      <Card>
        <CardHeader>
          <CardTitle>보관 환자 목록</CardTitle>
          <CardActions>
            <FilterGroup>
              <TextInput
                type="text"
                placeholder="이름/ID 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="보관 환자 검색"
              />
              <Select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                aria-label="위험도 필터"
              >
                <option value="all">위험도: 전체</option>
                <option value="high">고위험</option>
                <option value="medium">주의</option>
                <option value="low">양호</option>
              </Select>
              <Select
                value={cancerFilter}
                onChange={(e) => setCancerFilter(e.target.value)}
                aria-label="암종류 필터"
              >
                <option value="all">암종류: 전체</option>
                {Array.from(
                  new Set(patients.map((p) => p.cancerType).filter(Boolean))
                ).map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </Select>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="정렬 기준"
              >
                <option value="recent">최근 보관순</option>
                <option value="name">이름순</option>
                <option value="risk">위험도순</option>
              </Select>
            </FilterGroup>
            <OutlineButton onClick={handleExportCSV} title="CSV로 내보내기">
              CSV 다운로드
            </OutlineButton>
            <OutlineButton onClick={() => navigate("/")}>
              대시보드로
            </OutlineButton>
          </CardActions>
        </CardHeader>

        {loading ? (
          <div style={{ padding: "16px" }}>불러오는 중…</div>
        ) : displayedPatients.length === 0 ? (
          <div style={{ padding: "24px", color: "#666" }}>
            보관된 환자가 없습니다.
          </div>
        ) : (
          <TableWrapper>
            <Table>
              <StickyThead>
                <tr>
                  <Th>이름</Th>
                  <Th>생년월일</Th>
                  <Th>암종류</Th>
                  <Th>진단시기</Th>
                  <Th>연락처</Th>
                  <Th>위험도</Th>
                  <Th>보관일</Th>
                  <Th>작업</Th>
                </tr>
              </StickyThead>
              <tbody>
                {displayedPatients.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Link to={`/patients/${p.id}`}>{p.name || "익명"}</Link>
                    </Td>
                    <Td>{p.birthDate || "-"}</Td>
                    <Td>{p.cancerType || "-"}</Td>
                    <Td>{p.diagnosisDate || "-"}</Td>
                    <Td>{p.phone || "-"}</Td>
                    <Td>
                      <RiskBadge level={p.riskLevel}>
                        {p.riskLevel || "-"}
                      </RiskBadge>
                    </Td>
                    <Td>{formatDate(getArchivedDate(p))}</Td>
                    <Td>
                      <Actions>
                        <OutlineButton
                          onClick={() => handleUnarchive(p.id)}
                          aria-label="보관 해제"
                        >
                          복귀
                        </OutlineButton>
                        <DangerButton
                          onClick={() => handleDelete(p.id)}
                          aria-label="환자 삭제"
                        >
                          삭제
                        </DangerButton>
                      </Actions>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>
      <ChartRow>
        <ChartCard>
          <ChartTitle>암 종류별 분포</ChartTitle>
          {Object.keys(stats.byCancer).length === 0 ? (
            <div style={{ color: "#666" }}>데이터 없음</div>
          ) : (
            Object.entries(stats.byCancer).map(([key, val]) => (
              <BarRow key={key}>
                <div>
                  <LegendDot color={midBlue} />
                  {key}
                </div>
                <div
                  style={{
                    background: "#eef2ff",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <Bar
                    color={midBlue}
                    style={{
                      width: `${Math.round((val / stats.maxCancer) * 100)}%`,
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>{val}</div>
              </BarRow>
            ))
          )}
        </ChartCard>

        <ChartCard>
          <ChartTitle>위험도 분포</ChartTitle>
          {["high", "medium", "low"].map((lvl) => (
            <BarRow key={lvl}>
              <div>
                <LegendDot
                  color={
                    lvl === "high"
                      ? dangerRed
                      : lvl === "medium"
                      ? warnOrange
                      : okGreen
                  }
                />
                {lvl === "high" ? "고위험" : lvl === "medium" ? "주의" : "양호"}
              </div>
              <div
                style={{
                  background: "#eef2ff",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <Bar
                  color={
                    lvl === "high"
                      ? dangerRed
                      : lvl === "medium"
                      ? warnOrange
                      : okGreen
                  }
                  style={{
                    width: `${Math.round(
                      ((stats.byRisk[lvl] || 0) / stats.maxRisk) * 100
                    )}%`,
                  }}
                />
              </div>
              <div style={{ textAlign: "right" }}>{stats.byRisk[lvl] || 0}</div>
            </BarRow>
          ))}
        </ChartCard>
      </ChartRow>
    </Section>
  );
}
