package com.bpr.controller;

import com.bpr.dto.ProjectRequest;
import com.bpr.dto.ProjectResponse;
import com.bpr.dto.ProjectUpdateRequest;
import com.bpr.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 현장 생성
     * body에 templateId 포함 시 해당 템플릿 공정 구조 자동 복사
     */
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(projectService.createProject(userId, request));
    }

    /** 내 현장 목록 */
    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(projectService.getMyProjects(userId));
    }

    /** 현장 정보 수정 (이름/주소/날짜) */
    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectUpdateRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(projectService.updateProject(projectId, userId, request));
    }

    /** 현장 삭제 (하위 대공정/소공정 포함) */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long projectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        projectService.deleteProject(projectId, userId);
        return ResponseEntity.noContent().build();
    }
}
