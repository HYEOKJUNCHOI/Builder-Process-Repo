package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 보고서 항목 (report_items) 매핑 엔티티
 * 소공정 데이터를 저장 시점에 스냅샷으로 복사 → 원본 수정돼도 보고서 내용 유지
 */
@Entity
@Table(name = "report_items")
@Getter
@NoArgsConstructor
public class ReportItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Column(name = "minor_process_id")
    private Long minorProcessId; // 소공정 삭제돼도 NULL로 유지

    @Column(name = "name_snapshot", nullable = false, length = 100)
    private String nameSnapshot;

    @Column(name = "memo_snapshot", columnDefinition = "TEXT")
    private String memoSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_snapshot", nullable = false)
    private ProcessStatus statusSnapshot;

    /** 저장 시점의 대공정 이름 — 목록 서브텍스트 표시용 */
    @Column(name = "major_process_name_snapshot", length = 100)
    private String majorProcessNameSnapshot;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    /** 소공정 데이터를 스냅샷으로 복사하는 생성자 */
    public ReportItem(Report report, MinorProcess minor, int displayOrder) {
        this.report = report;
        this.minorProcessId = minor.getId();
        this.nameSnapshot = minor.getName();
        this.memoSnapshot = minor.getMemo();
        this.statusSnapshot = minor.getStatus();
        this.majorProcessNameSnapshot = minor.getMajorProcess().getName();
        this.displayOrder = displayOrder;
    }

    /** 보고서 내 메모 직접 편집 가능 */
    public void updateMemo(String memo) {
        this.memoSnapshot = memo;
    }
}
