package com.bpr.dto;

import com.bpr.entity.Project;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class ProjectResponse {

    private Long id;
    private String name;
    private String address;
    private BigDecimal lat;
    private BigDecimal lng;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;

    public ProjectResponse(Project project) {
        this.id = project.getId();
        this.name = project.getName();
        this.address = project.getAddress();
        this.lat = project.getLat();
        this.lng = project.getLng();
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.createdAt = project.getCreatedAt();
    }
}
