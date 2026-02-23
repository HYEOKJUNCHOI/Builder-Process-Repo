package com.bpr.controller;

import com.bpr.dto.MemoRequest;
import com.bpr.dto.ReportRequest;
import com.bpr.dto.ReportResponse;
import com.bpr.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 일지 저장 (Upsert — 같은 날짜 보고서가 있으면 항목만 추가) */
    @PostMapping("/api/projects/{projectId}/reports")
    public ResponseEntity<ReportResponse> createReport(
            @PathVariable Long projectId,
            @Valid @RequestBody ReportRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(reportService.createReport(projectId, request, userId));
    }

    /** 오늘 날짜 보고서 조회 — 없으면 204 No Content */
    @GetMapping("/api/projects/{projectId}/reports/today")
    public ResponseEntity<ReportResponse> getTodayReport(
            @PathVariable Long projectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return reportService.getTodayReport(projectId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** 일지 목록 조회 (날짜 내림차순) */
    @GetMapping("/api/projects/{projectId}/reports")
    public ResponseEntity<List<ReportResponse>> getReports(
            @PathVariable Long projectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(reportService.getReports(projectId, userId));
    }

    /** 일지 상세 조회 */
    @GetMapping("/api/reports/{reportId}")
    public ResponseEntity<ReportResponse> getReport(
            @PathVariable Long reportId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(reportService.getReport(reportId, userId));
    }

    /** 보고서 추가 메모 수정 */
    @PatchMapping("/api/reports/{reportId}/additional-memo")
    public ResponseEntity<Void> updateAdditionalMemo(
            @PathVariable Long reportId,
            @RequestBody MemoRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        reportService.updateAdditionalMemo(reportId, request.getMemo(), userId);
        return ResponseEntity.ok().build();
    }

    /** 보고서 항목 메모 수정 */
    @PatchMapping("/api/report-items/{itemId}/memo")
    public ResponseEntity<Void> updateItemMemo(
            @PathVariable Long itemId,
            @RequestBody MemoRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        reportService.updateItemMemo(itemId, request.getMemo(), userId);
        return ResponseEntity.ok().build();
    }
}
