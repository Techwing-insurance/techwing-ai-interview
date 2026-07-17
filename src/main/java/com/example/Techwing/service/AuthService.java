package com.example.Techwing.service;

import com.example.Techwing.models.User;
import com.example.Techwing.payload.AuthResponse;
import com.example.Techwing.payload.LoginRequest;
import com.example.Techwing.payload.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
    User getCurrentUser(String email);
}
