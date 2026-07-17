package com.example.Techwing.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardingController {

    // Forward all non-API paths to index.html so React Router can handle them
    @RequestMapping(value = {
        "/{x:[\\w\\-]+}", 
        "/{x:^(?!api$).*$}/**/{y:[\\w\\-]+}"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}