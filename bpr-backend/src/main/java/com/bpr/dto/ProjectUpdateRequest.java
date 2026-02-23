package com.bpr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 현장 정보 수정 요청 DTO
 * 공정 구조는 변경 불가 — 이름/주소/날짜만 수정
 */
@Getter
public class ProjectUpdateRequest {

    @NotBlank
    private String name;      // 현장명

    private String address;   // 현장주소 (없을 수 있음)

    @NotNull
    private LocalDate startDate; // 착공일

    @NotNull
    private LocalDate endDate;   // 준공예정일
}
