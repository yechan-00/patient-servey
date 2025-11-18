// src/components/MedicalStaffBadge.js
import React from "react";
import styled from "styled-components";

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #2a5e8c;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const CheckIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #2a5e8c;
  color: white;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
`;

function MedicalStaffBadge({ showLabel = false }) {
  return (
    <Badge>
      <CheckIcon>✓</CheckIcon>
      {showLabel && <span>의료 종사자</span>}
    </Badge>
  );
}

export default MedicalStaffBadge;
