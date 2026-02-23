package com.bpr.service;

import com.bpr.dto.ChecklistResponse;
import com.bpr.dto.DashboardResponse;
import com.bpr.entity.MajorProcess;
import com.bpr.entity.MinorProcess;
import com.bpr.entity.ProcessStatus;
import com.bpr.entity.Project;
import com.bpr.repository.MajorProcessRepository;
import com.bpr.repository.MinorProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChecklistService {

    private final ProjectService projectService;
    private final MajorProcessRepository majorProcessRepository;
    private final MinorProcessRepository minorProcessRepository;

    /** 체크리스트 전체 조회 (대공정 → 소공정 계층) */
    @Transactional(readOnly = true)
    public ChecklistResponse getChecklist(Long projectId, Long userId) {
        Project project = projectService.getProjectWithOwnerCheck(projectId, userId);
        return new ChecklistResponse(project);
    }

    /** 대시보드 조회 (오늘 할 일 + 진행도 통계) */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long projectId, Long userId) {
        Project project = projectService.getProjectWithOwnerCheck(projectId, userId);
        List<MinorProcess> todayTasks = minorProcessRepository.findTodayTasksByProjectId(projectId);
        // 진행도 계산을 위한 전체/완료 소공정 수
        int totalMinorCount = minorProcessRepository.countByMajorProcess_Project_Id(projectId);
        int doneMinorCount  = minorProcessRepository.countByMajorProcess_Project_IdAndStatus(
                projectId, ProcessStatus.DONE);
        return new DashboardResponse(project, todayTasks, totalMinorCount, doneMinorCount);
    }

    /** 대공정 추가 — 현재 가장 마지막 순서로 추가 */
    @Transactional
    public void addMajorProcess(Long projectId, String name, Long userId) {
        Project project = projectService.getProjectWithOwnerCheck(projectId, userId);
        int order = majorProcessRepository.countByProjectId(projectId) + 1;
        majorProcessRepository.save(new MajorProcess(project, name, order));
    }

    /** 소공정 추가 — 해당 대공정의 가장 마지막 순서로 추가 */
    @Transactional
    public void addMinorProcess(Long majorId, String name, String memo, Long userId) {
        MajorProcess major = getMajorWithOwnerCheck(majorId, userId);
        int order = minorProcessRepository.countByMajorProcessId(majorId) + 1;
        MinorProcess minor = new MinorProcess(major, name, order);
        // 메모가 있을 때만 저장 (null·공백이면 무시)
        if (memo != null && !memo.isBlank()) {
            minor.updateMemo(memo.trim());
        }
        minorProcessRepository.save(minor);
    }

    /**
     * 소공정 상태 순환 (탭 1번)
     * WAITING → IN_PROGRESS → TOUCH_UP → DONE → WAITING
     */
    @Transactional
    public ProcessStatus cycleStatus(Long minorId, Long userId) {
        MinorProcess minor = getMinorWithOwnerCheck(minorId, userId);
        minor.cycleStatus();
        return minor.getStatus();
    }

    /** 오늘 할 일 토글 */
    @Transactional
    public boolean toggleToday(Long minorId, Long userId) {
        MinorProcess minor = getMinorWithOwnerCheck(minorId, userId);
        minor.toggleToday();
        return minor.isToday();
    }

    /** 소공정 메모 수정 */
    @Transactional
    public void updateMemo(Long minorId, String memo, Long userId) {
        MinorProcess minor = getMinorWithOwnerCheck(minorId, userId);
        minor.updateMemo(memo);
    }

    /** 대공정 삭제 (소공정 CASCADE 삭제) */
    @Transactional
    public void deleteMajorProcess(Long majorId, Long userId) {
        getMajorWithOwnerCheck(majorId, userId);
        majorProcessRepository.deleteById(majorId);
    }

    /** 소공정 삭제 */
    @Transactional
    public void deleteMinorProcess(Long minorId, Long userId) {
        getMinorWithOwnerCheck(minorId, userId);
        minorProcessRepository.deleteById(minorId);
    }

    // ─── 소유권 검증 헬퍼 ────────────────────────────────────────

    private MajorProcess getMajorWithOwnerCheck(Long majorId, Long userId) {
        MajorProcess major = majorProcessRepository.findById(majorId)
                .orElseThrow(() -> new IllegalArgumentException("대공정을 찾을 수 없습니다."));
        projectService.getProjectWithOwnerCheck(major.getProject().getId(), userId);
        return major;
    }

    private MinorProcess getMinorWithOwnerCheck(Long minorId, Long userId) {
        MinorProcess minor = minorProcessRepository.findById(minorId)
                .orElseThrow(() -> new IllegalArgumentException("소공정을 찾을 수 없습니다."));
        projectService.getProjectWithOwnerCheck(
                minor.getMajorProcess().getProject().getId(), userId);
        return minor;
    }
}
