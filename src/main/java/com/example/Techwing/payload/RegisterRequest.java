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

    @NotBlank(message = "Password is required")
    private String password;

    private String branch;
    
    @NotBlank(message = "Pin number (Roll number) is required")
    private String pinNumber;
    
    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Track ID is required")
    private Long trackId;

    private String role;
}
