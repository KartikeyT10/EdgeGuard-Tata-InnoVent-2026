package com.example.main_el.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

@RestController
public class indexController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> index() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "EdgeGuard Spring Boot Core Backend API");
        status.put("port", 8080);
        status.put("api_endpoints", Arrays.asList(
            "POST /api/predict",
            "POST /api/vehicles",
            "POST /api/report",
            "POST /api/response"
        ));
        return ResponseEntity.ok(status);
    }
}
