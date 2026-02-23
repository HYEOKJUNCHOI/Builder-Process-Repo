package com.bpr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 현장(프로젝트) 테이블 (projects) 매핑 엔티티
 * 프로토타입 기준: 유저 1명 = 현장 1개
 */
@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(precision = 10, scale = 8)
    private BigDecimal lat;  // 카카오맵 위도

    @Column(precision = 11, scale = 8)
    private BigDecimal lng;  // 카카오맵 경도

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // cascade ALL + orphanRemoval: project 삭제 시 하위 major/minor 자동 삭제
    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<MajorProcess> majorProcesses = new ArrayList<>();

    public Project(Long userId, String name, String address,
                   BigDecimal lat, BigDecimal lng,
                   LocalDate startDate, LocalDate endDate) {
        this.userId = userId;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /** 현장 정보 수정 */
    public void update(String name, String address, LocalDate startDate, LocalDate endDate) {
        this.name = name;
        this.address = address;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
