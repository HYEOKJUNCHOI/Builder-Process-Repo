package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 공정 저장소 템플릿 (templates) 매핑 엔티티
 * userId = null → 시스템 기본 템플릿 (is_default = true, 수정/삭제 불가)
 */
@Entity
@Table(name = "templates")
@Getter
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId; // NULL이면 시스템 기본 템플릿

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 대공정 목록 — display_order 오름차순 정렬
    @OneToMany(mappedBy = "template", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<TemplateMajorProcess> majorProcesses = new ArrayList<>();
}
