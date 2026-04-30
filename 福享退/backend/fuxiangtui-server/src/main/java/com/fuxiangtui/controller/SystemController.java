package com.fuxiangtui.controller;

import com.fuxiangtui.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    @GetMapping("/health")
    public Result<?> health() {
        return Result.ok(Map.of("status", "UP", "version", "1.0.0"));
    }
}
