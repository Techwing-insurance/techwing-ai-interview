package com.example.Techwing.payload;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "PIN is required")
    @Size(min = 6, max = 6, message = "PIN must be exactly 6 digits")
    @Pattern(regexp = "\\d{6}", message = "PIN must be 6 numeric digits")
    private String pin;

    private String branch;
    private String phone;
    private String college;

    @NotNull(message = "Track ID is required")
    private Long trackId;
}
