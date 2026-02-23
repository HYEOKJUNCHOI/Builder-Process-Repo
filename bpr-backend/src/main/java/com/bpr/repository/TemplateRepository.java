package com.bpr.repository;

import com.bpr.entity.Template;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    /**
     * 내 템플릿(userId 일치) + 시스템 기본 템플릿(isDefault = true) 조회
     * 기본 템플릿이 위에 오도록 isDefault 내림차순 정렬
     */
    @Query("SELECT t FROM Template t WHERE t.userId = :userId OR t.isDefault = true ORDER BY t.isDefault DESC, t.id ASC")
    List<Template> findByUserIdOrDefault(Long userId);
}
