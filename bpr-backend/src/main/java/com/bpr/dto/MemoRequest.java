package com.bpr.dto;

import lombok.Getter;

/** 메모 수정 요청 DTO (소공정 인라인 메모, 보고서 항목 메모) */
@Getter
public class MemoRequest {

    private String memo; // null 허용 (메모 삭제 가능)
}
