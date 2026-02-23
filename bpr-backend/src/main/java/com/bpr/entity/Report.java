package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 일지(보고서) 테이블 (reports) 매핑 엔티티
 */
@Entity
@Table(name = "reports")
@Getter
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(length = 50)
    private String weather;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** 소장님이 직접 작성하는 현장 특이사항/전달사항 메모 */
    @Column(name = "additional_memo", columnDefinition = "TEXT")
    private String additionalMemo;

    @OneToMany(mappedBy = "report", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<ReportItem> items = new ArrayList<>();

    public Report(Long projectId, LocalDate reportDate, String weather) {
        this.projectId = projectId;
        this.reportDate = reportDate;
        this.weather = weather;
    }

    /** 추가 메모 수정 */
    public void updateAdditionalMemo(String memo) {
        this.additionalMemo = memo;
    }
}
