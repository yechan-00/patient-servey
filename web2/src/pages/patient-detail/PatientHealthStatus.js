// src/pages/patient-detail/PatientHealthStatus.js
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar, Bar } from "react-chartjs-2";

/**
 * PatientHealthStatus
 * --------------------
 * 상위에서 주입된 데이터(lastSurvey, user, patient) 중
 * 존재하는 첫 소스에서 stdScores/meanScores/riskGroups/overallRiskGroup을
 * 안정적으로 읽어와 표 + 레이더(원점수) + 바(T점수)를 그립니다.
 */

ChartJS.register(
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const KOR_LABEL = {
  physicalChange: "신체적 변화",
  healthManagement: "건강 관리",
  socialSupport: "사회적 지지",
  psychologicalBurden: "심리적 부담",
  socialBurden: "사회적 부담",
  resilience: "회복 탄력성",
};

const ORDER = [
  "physicalChange",
  "healthManagement",
  "socialSupport",
  "psychologicalBurden",
  "socialBurden",
  "resilience",
];

// Fallback interpreter for T 점수 → 위험도 (riskGroups 없을 때만 사용)
function riskFromT(t) {
  if (typeof t !== "number") return "정보 없음";
  if (t >= 60) return "고위험집단";
  if (t >= 40) return "주의집단";
  return "대상외"; // <40
}

function pick(paths, obj) {
  for (const p of paths) {
    const v = p
      .split(".")
      .reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
      );
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function useSources({ lastSurvey, user, patient }) {
  // stdScores/meanScores/riskGroups/overallRiskGroup을 어디서든 안전하게 가져오기
  const stdScores =
    pick(["stdScores"], lastSurvey) ||
    pick(["stdScores"], user) ||
    pick(["stdScores"], patient) ||
    {};

  const meanScores =
    pick(["meanScores"], lastSurvey) ||
    pick(["meanScores"], user) ||
    pick(["meanScores"], patient) ||
    {};

  const riskGroups =
    pick(["riskGroups"], lastSurvey) ||
    pick(["riskGroups"], user) ||
    pick(["riskGroups"], patient) ||
    {};

  const overallRiskGroup =
    pick(["overallRiskGroup"], lastSurvey) ||
    pick(["overallRiskGroup"], user) ||
    pick(["overallRiskGroup"], patient) ||
    "";

  return { stdScores, meanScores, riskGroups, overallRiskGroup };
}

export default function PatientHealthStatus({ lastSurvey, user, patient }) {
  const { stdScores, meanScores, riskGroups, overallRiskGroup } = useSources({
    lastSurvey,
    user,
    patient,
  });

  // 과거 오탈자/스네이크 케이스 방지용 앨리어스
  const getScore = (obj, key) => {
    if (!obj) return undefined;
    if (key in obj) return obj[key];
    const alias = {
      psychologicalBurden: ["psycnologicalBurden", "psycnological_burden"],
      healthManagement: ["health_management"],
      physicalChange: ["physical_change"],
      socialSupport: ["social_support"],
      socialBurden: ["social_burden"],
      resilience: [],
    };
    for (const a of alias[key] || []) {
      if (a in obj) return obj[a];
    }
    return undefined;
  };

  // 표/그래프 공용 데이터 행
  const rows = useMemo(() => {
    return ORDER.map((k) => {
      const mean = getScore(meanScores, k);
      const t = getScore(stdScores, k);
      const risk = getScore(riskGroups, k) || riskFromT(t);
      return { key: k, label: KOR_LABEL[k], mean, t, risk };
    });
  }, [meanScores, stdScores, riskGroups]);

  // ===== 레이더(원점수) & 바(T점수) 데이터셋/옵션 =====
  const radarData = useMemo(
    () => ({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: "원점수(1~5)",
          data: rows.map((r) =>
            typeof r.mean === "number" ? Number(r.mean.toFixed(2)) : 0
          ),
          backgroundColor: "rgba(42, 94, 140, 0.2)",
          borderColor: "rgba(42, 94, 140, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(42, 94, 140, 1)",
        },
      ],
    }),
    [rows]
  );

  const radarOptions = useMemo(
    () => ({
      scales: {
        r: {
          min: 1,
          max: 5,
          ticks: { stepSize: 1 },
          angleLines: { display: true },
        },
      },
      plugins: {
        legend: { display: true },
      },
      maintainAspectRatio: false,
    }),
    []
  );

  const barData = useMemo(
    () => ({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: "T점수",
          data: rows.map((r) => (typeof r.t === "number" ? r.t : 0)),
          backgroundColor: "rgba(42, 94, 140, 0.7)",
        },
      ],
    }),
    [rows]
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      scales: {
        y: { beginAtZero: true, min: 0, max: 80 },
      },
      plugins: {
        legend: { display: true },
      },
      maintainAspectRatio: false,
    }),
    []
  );

  return (
    <section>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0 }}>건강 상태 평가</h3>
        <small style={{ color: "#666" }}>
          종합 위험도: {overallRiskGroup || "정보 없음"}
        </small>
      </div>

      {/* 표 헤더 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr 1fr 1fr",
          gap: 12,
          padding: "8px 12px",
          background: "#f9fafb",
          border: "1px solid #eee",
          borderBottom: "none",
          fontSize: 13,
          color: "#555",
          fontWeight: 600,
        }}
      >
        <div>영역</div>
        <div>원점수(평균)</div>
        <div>T 점수</div>
        <div>위험도</div>
      </div>

      {/* 표 행 */}
      <div
        style={{
          border: "1px solid #eee",
          borderTop: "none",
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.key}
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 1fr 1fr",
              gap: 12,
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 600 }}>{r.label}</div>
            <div>{typeof r.mean === "number" ? r.mean.toFixed(2) : "—"}</div>
            <div>{typeof r.t === "number" ? r.t : "—"}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {r.risk || "정보 없음"}
            </div>
          </div>
        ))}
      </div>

      {/* 그래프 2개 (좌: 레이더, 우: 바) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 12,
            height: 360,
          }}
        >
          <h4 style={{ margin: "0 0 8px" }}>영역별 비교 (원점수)</h4>
          <div style={{ height: 300 }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 12,
            height: 360,
          }}
        >
          <h4 style={{ margin: "0 0 8px" }}>카테고리별 점수 (T점수)</h4>
          <div style={{ height: 300 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
