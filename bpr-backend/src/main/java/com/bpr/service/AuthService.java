package com.bpr.service;

import com.bpr.dto.AuthResponse;
import com.bpr.dto.LoginRequest;
import com.bpr.dto.RegisterRequest;
import com.bpr.entity.User;
import com.bpr.repository.UserRepository;
import com.bpr.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /** 회원가입 — 비밀번호는 BCrypt로 암호화하여 저장 */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByLoginId(request.getLoginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getLoginId(), encodedPassword, request.getName());
        userRepository.save(user);

        String token = jwtUtil.generateAccessToken(user.getId(), user.getLoginId());
        return new AuthResponse(token, user.getId(), user.getName());
    }

    /** 로그인 — 아이디/비밀번호 검증 후 JWT 발급 */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtUtil.generateAccessToken(user.getId(), user.getLoginId());
        return new AuthResponse(token, user.getId(), user.getName());
    }
}
