package com.example.Techwing.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.RequestDispatcher;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardingController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        
        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());
            
            // If it's a 404 (Not Found), it means React Router should handle this path!
            // Forward it to React's index.html
            if(statusCode == 404) {
                return "forward:/index.html";
            }
        }
        
        // If it's not a 404, just return the default error page
        return "error";
    }
}