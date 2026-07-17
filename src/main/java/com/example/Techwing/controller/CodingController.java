package com.example.Techwing.controller;

import com.example.Techwing.models.CodingProblem;
import com.example.Techwing.models.User;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.payload.CodeRunRequest;
import com.example.Techwing.payload.CodeRunResponse;
import com.example.Techwing.service.AuthService;
import com.example.Techwing.service.CodingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/coding")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CodingController {

    private final CodingService codingService;
    private final AuthService authService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<List<CodingProblem>>> startCoding(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        List<CodingProblem> problems = codingService.startCodingRound(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Coding round started", problems));
    }

    @GetMapping("/problem/{id}")
    public ResponseEntity<ApiResponse<CodingProblem>> getProblem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(codingService.getProblemById(id)));
    }

    @PostMapping("/run")
    public ResponseEntity<ApiResponse<CodeRunResponse>> runCode(@Valid @RequestBody CodeRunRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Code executed", codingService.runCode(request)));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<CodeRunResponse>> submitCode(@Valid @RequestBody CodeRunRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Code submitted", codingService.submitCode(request)));
    }

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<String>> completeCoding(@RequestParam Long sessionId) {
        codingService.completeCodingRound(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Coding round completed", null));
    }
}
