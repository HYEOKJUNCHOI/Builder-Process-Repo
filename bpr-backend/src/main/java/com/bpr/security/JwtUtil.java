package com.bpr.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * JWT 토큰 생성 · 검증 유틸리티
 * 시크릿 키는 application-secret.yml에서 주입
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    public JwtUtil(
            @Value("${jwt.secret-key}") String secretKeyBase64,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration) {
        byte[] keyBytes = Base64.getDecoder().decode(secretKeyBase64);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /** Access Token 생성 */
    public String generateAccessToken(Long userId, String loginId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("loginId", loginId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(secretKey)
                .compact();
    }

    /** 토큰에서 Claims 파싱 */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** 토큰 유효성 검사 */
    public boolean isValidToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** 토큰에서 userId 추출 */
    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }
}
