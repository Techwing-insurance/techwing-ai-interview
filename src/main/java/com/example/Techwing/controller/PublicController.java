package com.example.Techwing.controller;

import com.example.Techwing.models.TechnologyTrack;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.repository.TechnologyTrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PublicController {

    private final TechnologyTrackRepository trackRepository;

    @GetMapping("/tracks")
    public ResponseEntity<ApiResponse<List<TechnologyTrack>>> getActiveTracks() {
        return ResponseEntity.ok(ApiResponse.success(trackRepository.findByIsActiveTrue()));
    }
}
