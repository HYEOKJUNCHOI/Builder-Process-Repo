package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 실제 작업 소공정 (minor_processes) 매핑 엔티티
 * BPR의 핵심 데이터 단위
 * - is_today = true인 항목이 대시보드 "오늘 할 일"에 표시
 * - status는 탭 1번에 다음 단계로 순환 (ProcessStatus.next())
 */
@Entity
@Table(name = "minor_processes")
@Getter
@NoArgsConstructor
public class MinorProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id", nullable = false)
    private MajorProcess majorProcess;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus status = ProcessStatus.WAITING;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "is_today", nullable = false)
    private boolean isToday = false;  // Lombok → isToday() getter

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "has_divider", nullable = false)
    private boolean hasDivider = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public MinorProcess(MajorProcess majorProcess, String name, int displayOrder) {
        this.majorProcess = majorProcess;
        this.name = name;
        this.displayOrder = displayOrder;
    }

    /** 상태를 다음 단계로 순환 (WAITING→IN_PROGRESS→TOUCH_UP→DONE→WAITING) */
    public void cycleStatus() {
        this.status = this.status.next();
    }

    /** 오늘 할 일 토글 */
    public void toggleToday() {
        this.isToday = !this.isToday;
    }

    /** 메모 업데이트 */
    public void updateMemo(String memo) {
        this.memo = memo;
    }
}
