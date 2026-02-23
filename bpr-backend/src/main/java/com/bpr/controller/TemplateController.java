package com.bpr.controller;

import com.bpr.dto.TemplateResponse;
import com.bpr.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    /**
     * 내 템플릿 + 시스템 기본 템플릿 목록 조회
     * JWT 토큰에서 userId를 꺼내 필터링
     */
    @GetMapping
    public ResponseEntity<List<TemplateResponse>> getTemplates(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(templateService.getTemplates(userId));
    }
}
