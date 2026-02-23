package com.bpr.repository;

import com.bpr.entity.MinorProcess;
import com.bpr.entity.ProcessStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MinorProcessRepository extends JpaRepository<MinorProcess, Long> {

    int countByMajorProcessId(Long majorId);

    /** 프로젝트의 소공정 전체 수 (진행도 계산용) */
    int countByMajorProcess_Project_Id(Long projectId);

    /** 프로젝트의 특정 상태 소공정 수 (완료(DONE) 집계용) */
    int countByMajorProcess_Project_IdAndStatus(Long projectId, ProcessStatus status);

    /**
     * 특정 프로젝트의 "오늘 할 일" 목록 조회
     * 대공정 순서 → 소공정 순서 정렬
     */
    @Query("SELECT mp FROM MinorProcess mp " +
           "WHERE mp.majorProcess.project.id = :projectId AND mp.isToday = true " +
           "ORDER BY mp.majorProcess.displayOrder ASC, mp.displayOrder ASC")
    List<MinorProcess> findTodayTasksByProjectId(Long projectId);
}
