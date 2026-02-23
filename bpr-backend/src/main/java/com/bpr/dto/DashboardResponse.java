package com.bpr.dto;

import com.bpr.entity.MinorProcess;
import com.bpr.entity.ProcessStatus;
import com.bpr.entity.Project;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 대시보드 응답 DTO
 * 현장 기본 정보 + 오늘 할 일 목록 (is_today = true인 소공정)
 */
@Getter
public class DashboardResponse {

    private Long projectId;
    private String projectName;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<TodayTaskDto> todayTasks;
    /** 진행도 계산용 — 프로젝트 전체 소공정 수 */
    private int totalMinorCount;
    /** 진행도 계산용 — 완료(DONE) 상태 소공정 수 */
    private int doneMinorCount;

    public DashboardResponse(Project project, List<MinorProcess> todayTasks,
                             int totalMinorCount, int doneMinorCount) {
        this.projectId = project.getId();
        this.projectName = project.getName();
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.todayTasks = todayTasks.stream()
                .map(TodayTaskDto::new)
                .collect(Collectors.toList());
        this.totalMinorCount = totalMinorCount;
        this.doneMinorCount = doneMinorCount;
    }

    @Getter
    public static class TodayTaskDto {
        private Long minorProcessId;
        private String minorProcessName;
        private String majorProcessName;
        private ProcessStatus status;
        private String memo;

        public TodayTaskDto(MinorProcess minor) {
            this.minorProcessId = minor.getId();
            this.minorProcessName = minor.getName();
            this.majorProcessName = minor.getMajorProcess().getName();
            this.status = minor.getStatus();
            this.memo = minor.getMemo();
        }
    }
}
