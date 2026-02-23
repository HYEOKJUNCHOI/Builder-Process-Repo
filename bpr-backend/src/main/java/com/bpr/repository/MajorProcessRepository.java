package com.bpr.repository;

import com.bpr.entity.MajorProcess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MajorProcessRepository extends JpaRepository<MajorProcess, Long> {

    List<MajorProcess> findByProjectIdOrderByDisplayOrderAsc(Long projectId);

    int countByProjectId(Long projectId);
}
