package com.example.Techwing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InterviewException extends RuntimeException {
    public InterviewException(String message) { super(message); }
}
