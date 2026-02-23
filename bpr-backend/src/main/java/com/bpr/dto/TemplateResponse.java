package com.bpr.dto;

import com.bpr.entity.Template;
import com.bpr.entity.TemplateMajorProcess;
import com.bpr.entity.TemplateMinorProcess;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 공정 저장소 템플릿 응답 DTO
 * 대공정 → 소공정 계층 구조로 변환
 */
@Getter
public class TemplateResponse {

    private Long id;
    private String name;
    @JsonProperty("isDefault")  // Jackson이 is 접두사 제거해 "default"로 직렬화하는 버그 방지
    private boolean isDefault;
    private List<MajorProcessDto> majorProcesses;

    public TemplateResponse(Template template) {
        this.id = template.getId();
        this.name = template.getName();
        this.isDefault = template.isDefault();
        this.majorProcesses = template.getMajorProcesses().stream()
                .map(MajorProcessDto::new)
                .collect(Collectors.toList());
    }

    @Getter
    public static class MajorProcessDto {
        private Long id;
        private String name;
        private int displayOrder;
        private List<MinorProcessDto> minorProcesses;

        public MajorProcessDto(TemplateMajorProcess major) {
            this.id = major.getId();
            this.name = major.getName();
            this.displayOrder = major.getDisplayOrder();
            this.minorProcesses = major.getMinorProcesses().stream()
                    .map(MinorProcessDto::new)
                    .collect(Collectors.toList());
        }
    }

    @Getter
    public static class MinorProcessDto {
        private Long id;
        private String name;
        private int displayOrder;
        private boolean hasDivider;

        public MinorProcessDto(TemplateMinorProcess minor) {
            this.id = minor.getId();
            this.name = minor.getName();
            this.displayOrder = minor.getDisplayOrder();
            this.hasDivider = minor.isHasDivider();
        }
    }
}
