package com.bpr.dto;

import com.bpr.entity.MajorProcess;
import com.bpr.entity.MinorProcess;
import com.bpr.entity.ProcessStatus;
import com.bpr.entity.Project;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 체크리스트 전체 응답 DTO
 * 프로젝트 → 대공정 → 소공정 계층 구조
 */
@Getter
public class ChecklistResponse {

    private Long projectId;
    private String projectName;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MajorDto> majorProcesses;

    public ChecklistResponse(Project project) {
        this.projectId = project.getId();
        this.projectName = project.getName();
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.majorProcesses = project.getMajorProcesses().stream()
                .map(MajorDto::new)
                .collect(Collectors.toList());
    }

    @Getter
    public static class MajorDto {
        private Long id;
        private String name;
        private int displayOrder;
        private List<MinorDto> minorProcesses;

        public MajorDto(MajorProcess major) {
            this.id = major.getId();
            this.name = major.getName();
            this.displayOrder = major.getDisplayOrder();
            this.minorProcesses = major.getMinorProcesses().stream()
                    .map(MinorDto::new)
                    .collect(Collectors.toList());
        }
    }

    @Getter
    public static class MinorDto {
        private Long id;
        private String name;
        private ProcessStatus status;
        private String memo;
        private boolean isToday;
        private int displayOrder;
        private boolean hasDivider;

        public MinorDto(MinorProcess minor) {
            this.id = minor.getId();
            this.name = minor.getName();
            this.status = minor.getStatus();
            this.memo = minor.getMemo();
            this.isToday = minor.isToday();
            this.displayOrder = minor.getDisplayOrder();
            this.hasDivider = minor.isHasDivider();
        }
    }
}
