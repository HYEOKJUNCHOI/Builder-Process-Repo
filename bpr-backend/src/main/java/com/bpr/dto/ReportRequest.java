package com.bpr.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * 일지 저장 요청 DTO
 * 소장님이 직접 고른 소공정 ID 목록만 보고서에 담김
 */
@Getter
public class ReportRequest {

    @NotNull
    private LocalDate reportDate;

    private String weather;

    @NotEmpty
    private List<Long> minorProcessIds; // 보고서에 담을 소공정 ID 목록
}
