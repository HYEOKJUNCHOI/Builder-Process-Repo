package com.bpr.service;

import com.bpr.dto.ReportRequest;
import com.bpr.dto.ReportResponse;
import com.bpr.entity.MinorProcess;
import com.bpr.entity.Report;
import com.bpr.entity.ReportItem;
import com.bpr.repository.MinorProcessRepository;
import com.bpr.repository.ReportItemRepository;
import com.bpr.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProjectService projectService;
    private final ReportRepository reportRepository;
    private final ReportItemRepository reportItemRepository;
    private final MinorProcessRepository minorProcessRepository;

    /**
     * 일지 저장 (Upsert)
     * 같은 날짜의 보고서가 이미 존재하면 해당 보고서에 항목을 추가.
     * 없으면 새로 생성. 중복 소공정은 추가하지 않음.
     */
    @Transactional
    public ReportResponse createReport(Long projectId, ReportRequest request, Long userId) {
        projectService.getProjectWithOwnerCheck(projectId, userId);

        // 같은 날짜 보고서 존재 여부 확인 — 있으면 재사용, 없으면 신규 생성
        Report report = reportRepository
                .findByProjectIdAndReportDate(projectId, request.getReportDate())
                .orElseGet(() -> reportRepository.save(
                        new Report(projectId, request.getReportDate(), request.getWeather())));

        // 기존 항목 수 기준으로 순서 부여
        int order = reportItemRepository.countByReport(report) + 1;

        for (Long minorId : request.getMinorProcessIds()) {
            // 같은 소공정이 이미 보고서에 있으면 스킵 (중복 방지)
            if (reportItemRepository.existsByReportAndMinorProcessId(report, minorId)) {
                continue;
            }
            MinorProcess minor = minorProcessRepository.findById(minorId)
                    .orElseThrow(() -> new IllegalArgumentException("소공정을 찾을 수 없습니다: " + minorId));
            reportItemRepository.save(new ReportItem(report, minor, order++));
        }

        return new ReportResponse(reportRepository.findById(report.getId()).orElseThrow());
    }

    /**
     * 오늘 날짜 보고서 조회
     * 오늘 작성된 보고서가 없으면 빈 Optional 반환
     */
    @Transactional(readOnly = true)
    public Optional<ReportResponse> getTodayReport(Long projectId, Long userId) {
        projectService.getProjectWithOwnerCheck(projectId, userId);
        return reportRepository
                .findByProjectIdAndReportDate(projectId, LocalDate.now())
                .map(ReportResponse::new);
    }

    /** 현장의 일지 목록 조회 (날짜 내림차순) */
    @Transactional(readOnly = true)
    public List<ReportResponse> getReports(Long projectId, Long userId) {
        projectService.getProjectWithOwnerCheck(projectId, userId);
        return reportRepository.findByProjectIdOrderByReportDateDesc(projectId).stream()
                .map(ReportResponse::new)
                .collect(Collectors.toList());
    }

    /** 일지 상세 조회 */
    @Transactional(readOnly = true)
    public ReportResponse getReport(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("일지를 찾을 수 없습니다."));
        projectService.getProjectWithOwnerCheck(report.getProjectId(), userId);
        return new ReportResponse(report);
    }

    /** 보고서 추가 메모 수정 */
    @Transactional
    public void updateAdditionalMemo(Long reportId, String memo, Long userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("일지를 찾을 수 없습니다."));
        projectService.getProjectWithOwnerCheck(report.getProjectId(), userId);
        report.updateAdditionalMemo(memo);
    }

    /** 보고서 항목 메모 수정 */
    @Transactional
    public void updateItemMemo(Long itemId, String memo, Long userId) {
        ReportItem item = reportItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("보고서 항목을 찾을 수 없습니다."));
        Report report = reportRepository.findById(item.getReport().getId()).orElseThrow();
        projectService.getProjectWithOwnerCheck(report.getProjectId(), userId);
        item.updateMemo(memo);
    }
}
