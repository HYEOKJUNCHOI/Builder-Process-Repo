package com.bpr.dto;

import com.bpr.entity.ProcessStatus;
import com.bpr.entity.Report;
import com.bpr.entity.ReportItem;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class ReportResponse {

    private Long id;
    private LocalDate reportDate;
    private String weather;
    private String additionalMemo;
    private LocalDateTime createdAt;
    private List<ItemDto> items;

    public ReportResponse(Report report) {
        this.id = report.getId();
        this.reportDate = report.getReportDate();
        this.weather = report.getWeather();
        this.additionalMemo = report.getAdditionalMemo();
        this.createdAt = report.getCreatedAt();
        this.items = report.getItems().stream()
                .map(ItemDto::new)
                .collect(Collectors.toList());
    }

    @Getter
    public static class ItemDto {
        private Long id;
        private Long minorProcessId;
        private String nameSnapshot;
        /** 대공정명 — 목록 서브텍스트 표시용 */
        private String majorProcessNameSnapshot;
        private String memoSnapshot;
        private ProcessStatus statusSnapshot;
        private int displayOrder;

        public ItemDto(ReportItem item) {
            this.id = item.getId();
            this.minorProcessId = item.getMinorProcessId();
            this.nameSnapshot = item.getNameSnapshot();
            this.majorProcessNameSnapshot = item.getMajorProcessNameSnapshot();
            this.memoSnapshot = item.getMemoSnapshot();
            this.statusSnapshot = item.getStatusSnapshot();
            this.displayOrder = item.getDisplayOrder();
        }
    }
}
