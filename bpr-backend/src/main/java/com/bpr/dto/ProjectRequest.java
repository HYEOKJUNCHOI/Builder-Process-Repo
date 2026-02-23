package com.bpr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 현장 생성 요청 DTO
 * templateId가 있으면 해당 템플릿의 공정 구조를 함께 복사
 */
@Getter
public class ProjectRequest {

    @NotBlank
    private String name;         // 현장명

    private String address;      // 현장주소 (없을 수 있음)
    private BigDecimal lat;      // 위도 (카카오맵)
    private BigDecimal lng;      // 경도 (카카오맵)

    @NotNull
    private LocalDate startDate; // 착공일

    @NotNull
    private LocalDate endDate;   // 준공예정일

    private Long templateId;     // 공정 저장소에서 가져올 템플릿 ID (선택)
}
