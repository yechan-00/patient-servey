// src/components/StatusSelect.jsx
import React from "react";
import styled from "styled-components";

const Select = styled.select`
  width: ${(props) => (props.$fullWidth ? "100%" : "auto")};
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  height: 40px;
  background-color: #fff;
`;

/**
 * 드롭다운형 상담 상태 선택 컴포넌트
 * props:
 *  - value: 현재 값 ("pending" | "accepted" | "completed" | "cancelled")
 *  - onChange: (nextValue) => void
 *  - fullWidth: 가로폭 100%
 *  - label: 접근성 라벨 (외부 Label 컴포넌트가 있으면 생략 가능)
 */
export default function StatusSelect({ value, onChange, fullWidth = false, label = "상담 상태" }) {
  // CounselingRecordPage.js와 동일한 상태 값으로 통일!
  const options = [
    { value: "pending", label: "대기" },
    { value: "accepted", label: "예약 확정" },
    { value: "completed", label: "완료" },
    { value: "cancelled", label: "취소" },
  ];

  return (
    <Select
      aria-label={label}
      value={value || "pending"}
      onChange={(e) => onChange && onChange(e.target.value)}
      $fullWidth={fullWidth}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}