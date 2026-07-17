package com.example.Techwing.payload;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TrackRequest {
    @NotBlank(message = "Name is required")
    private String name;

    private String description;
}
