package com.bpr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class RegisterRequest {

    @NotBlank
    @Size(min = 4, max = 50)
    private String loginId;

    @NotBlank
    @Size(min = 4, max = 50)
    private String password;

    @NotBlank
    @Size(min = 1, max = 50)
    private String name;
}
