package com.bpr.repository;

import com.bpr.entity.Report;
import com.bpr.entity.ReportItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportItemRepository extends JpaRepository<ReportItem, Long> {

    /** 기존 보고서에 항목 추가 시 순서 계산용 */
    int countByReport(Report report);

    /** 같은 소공정 중복 추가 방지용 */
    boolean existsByReportAndMinorProcessId(Report report, Long minorProcessId);
}
