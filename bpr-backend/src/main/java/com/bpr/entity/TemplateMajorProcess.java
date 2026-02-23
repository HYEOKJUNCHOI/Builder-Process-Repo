package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

/**
 * 템플릿 대공정 (template_major_processes) 매핑 엔티티
 * 하나의 Template 안에 여러 대공정이 존재
 */
@Entity
@Table(name = "template_major_processes")
@Getter
public class TemplateMajorProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Template template;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    // 소공정 목록 — display_order 오름차순 정렬
    @OneToMany(mappedBy = "majorProcess", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<TemplateMinorProcess> minorProcesses = new ArrayList<>();
}
