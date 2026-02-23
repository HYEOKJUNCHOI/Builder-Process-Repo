package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 실제 작업 대공정 (major_processes) 매핑 엔티티
 * 템플릿에서 복사하거나 직접 추가 가능
 */
@Entity
@Table(name = "major_processes")
@Getter
@NoArgsConstructor
public class MajorProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // cascade ALL: major 삭제 시 하위 minor 자동 삭제
    @OneToMany(mappedBy = "majorProcess", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<MinorProcess> minorProcesses = new ArrayList<>();

    public MajorProcess(Project project, String name, int displayOrder) {
        this.project = project;
        this.name = name;
        this.displayOrder = displayOrder;
    }
}
