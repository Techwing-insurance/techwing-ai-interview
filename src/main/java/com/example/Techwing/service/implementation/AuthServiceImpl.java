package com.example.Techwing.service.implementation;

import com.example.Techwing.exception.InvalidTokenException;
import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.exception.UserAlreadyExistsException;
import com.example.Techwing.models.RefreshToken;
import com.example.Techwing.models.TechnologyTrack;
import com.example.Techwing.models.User;
import com.example.Techwing.payload.AuthResponse;
import com.example.Techwing.payload.LoginRequest;
import com.example.Techwing.payload.RegisterRequest;
import com.example.Techwing.repository.RefreshTokenRepository;
import com.example.Techwing.repository.TechnologyTrackRepository;
import com.example.Techwing.repository.UserRepository;
import com.example.Techwing.securityconfig.JwtService;
import com.example.Techwing.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TechnologyTrackRepository trackRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiry;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("Email already registered: " + normalizedEmail);
        }
        TechnologyTrack track = trackRepository.findById(request.getTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("TechnologyTrack", "id", request.getTrackId()));

        User user = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .branch(request.getBranch())
                .pinNumber(request.getPinNumber())
                .year(request.getYear())
                .track(track)
                .build();
        user = userRepository.save(user);
        log.info("Registered new student: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        
        // Let AuthenticationManager handle the password check to avoid double hashing (which is slow and exhausts connections)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));
                
        // Fetch user only after successful authentication
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Email is not registered."));

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));
        if (refreshToken.getRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token expired or revoked");
        }
        User user = refreshToken.getUser();
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Transactional
    protected AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshTokenValue = UUID.randomUUID().toString();

        refreshTokenRepository.deleteByUserId(user.getId());
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiry / 1000))
                .build();
        refreshTokenRepository.save(rt);

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .build();
    }
}
