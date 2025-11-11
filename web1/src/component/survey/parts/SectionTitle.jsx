

// web1/src/component/survey/parts/SectionTitle.jsx
import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

/**
 * SectionTitle
 * - 설문 섹션 상단 타이틀/부제/스텝 정보를 일관된 스타일로 표시
 *
 * Props:
 *  - title: 메인 타이틀(필수)
 *  - subtitle: 보조 설명(선택)
 *  - step: 현재 스텝 번호(선택, number)
 *  - total: 총 스텝 수(선택, number)
 *  - align: "left" | "center" | "right" (기본: "left")
 *  - required: 필수 섹션 표시 뱃지 여부(기본: false)
 *  - mb: 하단 마진 (MUI spacing number, 기본 2)
 *  - sx: 커스텀 스타일 (선택)
 *  - right: 우측 상단에 붙일 추가 JSX (예: 진행도, 버튼 등)
 *
 * 예)
 *  <SectionTitle title="신체적 변화" subtitle="최근 한 달을 기준으로 응답해주세요."
 *                step={1} total={7} required right={<MyProgress />} />
 */
function SectionTitle({
  title,
  subtitle,
  step,
  total,
  align = "left",
  required = false,
  mb = 2,
  sx,
  right,
}) {
  const hasStep = Number.isFinite(step) && Number.isFinite(total);

  return (
    <Box
      sx={{
        mb,
        ...(sx || {}),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: subtitle ? "flex-start" : "center",
          justifyContent:
            align === "center" ? "center" : align === "right" ? "flex-end" : "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Left: Title + Subtitle */}
        <Box sx={{ minWidth: 0, flex: align === "left" ? "1 1 auto" : "0 0 auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.25,
                textAlign: align,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {title}
            </Typography>

            {required && (
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  px: 1,
                  py: "2px",
                  borderRadius: "6px",
                  bgcolor: "error.light",
                  color: "common.white",
                }}
              >
                필수
              </Typography>
            )}

            {hasStep && (
              <Typography
                component="span"
                sx={{
                  ml: 0.5,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                ({step}/{total})
              </Typography>
            )}
          </Box>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "text.secondary",
                textAlign: align,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Right slot (optional) */}
        {right && <Box sx={{ ml: "auto" }}>{right}</Box>}
      </Box>
    </Box>
  );
}

SectionTitle.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  step: PropTypes.number,
  total: PropTypes.number,
  align: PropTypes.oneOf(["left", "center", "right"]),
  required: PropTypes.bool,
  mb: PropTypes.number,
  sx: PropTypes.object,
  right: PropTypes.node,
};

export default SectionTitle;