import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

/* ── 스타일 ── */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
`;

const StatCard = styled.div`
  background: #fff;
  border-radius: ${theme.radius.lg};
  padding: 12px 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: ${theme.shadow.sm};
  position: relative; /* 툴팁 포지셔닝 기준점 */
  cursor: default;

  /* 클래스명으로 자식 툴팁 제어 — babel 플러그인 없이도 동작하는 순수 CSS 방식 */
  &:hover .stat-tooltip {
    opacity: 1;
  }
`;

/* 호버 시 나타나는 툴팁 — 부모 StatCard의 &:hover .stat-tooltip 으로 제어 */
const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 30, 55, 0.93);
  color: #fff;
  font-size: 11px;
  line-height: 1.6;
  padding: 7px 11px;
  border-radius: ${theme.radius.sm};
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s;
  z-index: 100;

  /* 아래 삼각 화살표 */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(20, 30, 55, 0.93);
  }
`;

const StatRingWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatRingLabel = styled.span`
  position: absolute;
  font-size: 12px;
  font-weight: ${theme.font.weight.bold};
  color: ${({ deviation }) =>
    deviation === undefined ? theme.color.navy
    : deviation <= 0        ? '#2E7D32'
    :                         '#C62828'};
`;

const StatName = styled.span`
  font-size: ${theme.font.size.xs};
  font-weight: ${theme.font.weight.semibold};
  color: ${theme.color.gray700};
`;

const StatDesc = styled.span`
  font-size: 10px;
  color: ${theme.color.gray400};
`;

/* ── SVG 원형 진행 링 ── */
function CircleProgress({ value, color, size = 68 }) {
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);
  const half = size / 2;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="#f0efed" strokeWidth={6} />
      <circle
        cx={half} cy={half} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

/**
 * 공정 진행 통계 카드 3개 (진척도 / 진행도 / 공정편차)
 * @param {{ startDate, endDate, totalMinorCount, doneMinorCount }} dashboard
 * @param {boolean} showTooltips - 호버 툴팁 표시 여부 (기본 true, 대시보드에선 false)
 */
export default function StatsSection({ dashboard, showTooltips = true }) {
  const today = new Date();
  const start = dashboard.startDate ? new Date(dashboard.startDate) : null;
  const end   = dashboard.endDate   ? new Date(dashboard.endDate)   : null;

  // 진척도 — 착공일~준공예정일 대비 경과 비율
  let schedule = 0;
  if (start && end) {
    const totalDays   = Math.max(1, Math.ceil((end   - start) / 86400000));
    const elapsedDays = Math.max(0, Math.ceil((today - start) / 86400000));
    schedule = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }

  // 진행도 — DONE 소공정 / 전체 소공정
  const total    = dashboard.totalMinorCount ?? 0;
  const done     = dashboard.doneMinorCount  ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // 공정편차 — 양수: 일정 뒤처짐, 음수: 앞서감
  const deviation      = schedule - progress;
  const deviationCount = Math.round(Math.abs(deviation) * total / 100);
  const isAhead        = deviation <= 0;

  return (
    <StatsGrid>
      {/* 진척도 — 호버 시 착공일/준공예정일 표시 (showTooltips=true일 때만) */}
      <StatCard>
        {showTooltips && dashboard.startDate && dashboard.endDate && (
          <Tooltip className="stat-tooltip">
            착공일: {dashboard.startDate}
            <br />
            준공예정일: {dashboard.endDate}
          </Tooltip>
        )}
        <StatRingWrap>
          <CircleProgress value={schedule} color="#293552" />
          <StatRingLabel>{schedule}%</StatRingLabel>
        </StatRingWrap>
        <StatName>진척도</StatName>
      </StatCard>

      {/* 진행도 — 호버 시 "총 공정 N개 / M개 완료" 표시 (showTooltips=true일 때만) */}
      <StatCard>
        {showTooltips && total > 0 && (
          <Tooltip className="stat-tooltip">
            총 공정 {total}개<br />
            {done}개 완료
          </Tooltip>
        )}
        <StatRingWrap>
          <CircleProgress value={progress} color="#1565C0" />
          <StatRingLabel>{progress}%</StatRingLabel>
        </StatRingWrap>
        <StatName>진행도</StatName>
      </StatCard>

      {/* 공정편차 — 링 안에 편차%, 아래에 소공정 개수 */}
      <StatCard>
        <StatRingWrap>
          <CircleProgress
            value={Math.abs(deviation)}
            color={isAhead ? '#2E7D32' : '#C62828'}
          />
          <StatRingLabel deviation={deviation}>
            {Math.abs(deviation)}%
          </StatRingLabel>
        </StatRingWrap>
        <StatName>공정편차</StatName>
        <StatDesc>
          {total === 0 ? '-' : `${deviationCount}개`}
        </StatDesc>
      </StatCard>
    </StatsGrid>
  );
}
