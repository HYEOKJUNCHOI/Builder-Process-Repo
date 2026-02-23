package com.bpr.service;

import com.bpr.dto.TemplateResponse;
import com.bpr.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateRepository templateRepository;

    /**
     * 내 템플릿 + 시스템 기본 템플릿 조회
     * DTO 변환을 트랜잭션 안에서 수행해 LazyLoading 오류를 방지
     */
    @Transactional(readOnly = true)
    public List<TemplateResponse> getTemplates(Long userId) {
        return templateRepository.findByUserIdOrDefault(userId).stream()
                .map(TemplateResponse::new)
                .collect(Collectors.toList());
    }
}
