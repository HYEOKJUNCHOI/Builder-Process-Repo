package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;

/**
 * 템플릿 소공정 (template_minor_processes) 매핑 엔티티
 * 하나의 TemplateMajorProcess 안에 여러 소공정이 존재
 */
@Entity
@Table(name = "template_minor_processes")
@Getter
public class TemplateMinorProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id", nullable = false)
    private TemplateMajorProcess majorProcess;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "has_divider", nullable = false)
    private boolean hasDivider = false;
}
