package com.bpr.service;

import com.bpr.dto.ProjectRequest;
import com.bpr.dto.ProjectResponse;
import com.bpr.dto.ProjectUpdateRequest;
import com.bpr.entity.*;
import com.bpr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TemplateRepository templateRepository;
    private final MajorProcessRepository majorProcessRepository;
    private final MinorProcessRepository minorProcessRepository;

    /**
     * 현장 생성
     * templateId가 있으면 해당 템플릿의 공정 구조를 그대로 복사
     */
    @Transactional
    public ProjectResponse createProject(Long userId, ProjectRequest request) {
        Project project = new Project(
                userId,
                request.getName(),
                request.getAddress(),
                request.getLat(),
                request.getLng(),
                request.getStartDate(),
                request.getEndDate()
        );
        projectRepository.save(project);

        // 템플릿 ID가 있으면 공정 구조 복사
        if (request.getTemplateId() != null) {
            copyTemplateToProject(project, request.getTemplateId());
        }

        return new ProjectResponse(project);
    }

    /** 내 현장 목록 조회 */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(Long userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(ProjectResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 템플릿 공정 구조를 프로젝트로 복사
     * 대공정 → 소공정 순서대로 복사, 메모는 제외
     */
    private void copyTemplateToProject(Project project, Long templateId) {
        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 템플릿입니다."));

        for (TemplateMajorProcess templateMajor : template.getMajorProcesses()) {
            MajorProcess major = new MajorProcess(
                    project,
                    templateMajor.getName(),
                    templateMajor.getDisplayOrder()
            );
            majorProcessRepository.save(major);

            for (TemplateMinorProcess templateMinor : templateMajor.getMinorProcesses()) {
                MinorProcess minor = new MinorProcess(
                        major,
                        templateMinor.getName(),
                        templateMinor.getDisplayOrder()
                );
                minorProcessRepository.save(minor);
            }
        }
    }

    /**
     * 현장 정보 수정 (이름/주소/날짜)
     * 공정 구조는 변경 불가
     */
    @Transactional
    public ProjectResponse updateProject(Long projectId, Long userId, ProjectUpdateRequest request) {
        Project project = getProjectWithOwnerCheck(projectId, userId);
        project.update(request.getName(), request.getAddress(), request.getStartDate(), request.getEndDate());
        return new ProjectResponse(project);
    }

    /**
     * 현장 삭제
     * cascade 설정으로 하위 대공정/소공정 자동 삭제
     */
    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        Project project = getProjectWithOwnerCheck(projectId, userId);
        projectRepository.delete(project);
    }

    /** 프로젝트 소유권 검증 헬퍼 */
    public Project getProjectWithOwnerCheck(Long projectId, Long userId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("현장을 찾을 수 없습니다."));
    }
}
