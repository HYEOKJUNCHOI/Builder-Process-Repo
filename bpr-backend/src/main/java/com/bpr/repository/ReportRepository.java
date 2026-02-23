package com.bpr.repository;

import com.bpr.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByProjectIdOrderByReportDateDesc(Long projectId);

    /** 같은 날짜 보고서 조회 — upsert 및 오늘 보고서 조회에 사용 */
    Optional<Report> findByProjectIdAndReportDate(Long projectId, LocalDate reportDate);
}
