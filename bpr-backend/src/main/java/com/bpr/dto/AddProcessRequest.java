package com.bpr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

/** 대공정 / 소공정 추가 요청 공통 DTO */
@Getter
public class AddProcessRequest {

    @NotBlank
    private String name;

    /** 소공정 생성 시 선택 메모 — 대공정 추가에서는 무시됨 */
    private String memo;
}
