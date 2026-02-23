package com.bpr.controller;

import com.bpr.dto.AddProcessRequest;
import com.bpr.dto.ChecklistResponse;
import com.bpr.dto.DashboardResponse;
import com.bpr.dto.MemoRequest;
import com.bpr.entity.ProcessStatus;
import com.bpr.service.ChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ChecklistController {

    private final ChecklistService checklistService;

    /** 체크리스트 전체 조회 */
    @GetMapping("/api/projects/{projectId}/checklist")
    public ResponseEntity<ChecklistResponse> getChecklist(
            @PathVariable Long projectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(checklistService.getChecklist(projectId, userId));
    }

    /** 대시보드 — 오늘 할 일 조회 */
    @GetMapping("/api/projects/{projectId}/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable Long projectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(checklistService.getDashboard(projectId, userId));
    }

    /** 대공정 추가 */
    @PostMapping("/api/projects/{projectId}/major-processes")
    public ResponseEntity<Void> addMajorProcess(
            @PathVariable Long projectId,
            @Valid @RequestBody AddProcessRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        checklistService.addMajorProcess(projectId, request.getName(), userId);
        return ResponseEntity.ok().build();
    }

    /** 소공정 추가 */
    @PostMapping("/api/major-processes/{majorId}/minor-processes")
    public ResponseEntity<Void> addMinorProcess(
            @PathVariable Long majorId,
            @Valid @RequestBody AddProcessRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        checklistService.addMinorProcess(majorId, request.getName(), request.getMemo(), userId);
        return ResponseEntity.ok().build();
    }

    /** 소공정 상태 순환 (탭 1번) */
    @PatchMapping("/api/minor-processes/{minorId}/status")
    public ResponseEntity<Map<String, ProcessStatus>> cycleStatus(
            @PathVariable Long minorId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        ProcessStatus newStatus = checklistService.cycleStatus(minorId, userId);
        return ResponseEntity.ok(Map.of("status", newStatus));
    }

    /** 오늘 할 일 토글 */
    @PatchMapping("/api/minor-processes/{minorId}/today")
    public ResponseEntity<Map<String, Boolean>> toggleToday(
            @PathVariable Long minorId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        boolean isToday = checklistService.toggleToday(minorId, userId);
        return ResponseEntity.ok(Map.of("isToday", isToday));
    }

    /** 소공정 메모 수정 */
    @PatchMapping("/api/minor-processes/{minorId}/memo")
    public ResponseEntity<Void> updateMemo(
            @PathVariable Long minorId,
            @RequestBody MemoRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        checklistService.updateMemo(minorId, request.getMemo(), userId);
        return ResponseEntity.ok().build();
    }

    /** 대공정 삭제 */
    @DeleteMapping("/api/major-processes/{majorId}")
    public ResponseEntity<Void> deleteMajorProcess(
            @PathVariable Long majorId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        checklistService.deleteMajorProcess(majorId, userId);
        return ResponseEntity.noContent().build();
    }

    /** 소공정 삭제 */
    @DeleteMapping("/api/minor-processes/{minorId}")
    public ResponseEntity<Void> deleteMinorProcess(
            @PathVariable Long minorId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        checklistService.deleteMinorProcess(minorId, userId);
        return ResponseEntity.noContent().build();
    }
}
