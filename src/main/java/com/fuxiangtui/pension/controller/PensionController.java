package com.fuxiangtui.pension.controller;

import com.fuxiangtui.pension.dto.request.PensionAdjustmentRequest;
import com.fuxiangtui.pension.dto.request.PensionCalculateRequest;
import com.fuxiangtui.pension.dto.request.PensionComparisonRequest;
import com.fuxiangtui.pension.dto.response.PensionAdjustmentResponse;
import com.fuxiangtui.pension.dto.response.PensionCalculateResponse;
import com.fuxiangtui.pension.dto.response.PensionComparisonResponse;
import com.fuxiangtui.pension.service.PensionAdjustmentService;
import com.fuxiangtui.pension.service.PensionCalculateService;
import com.fuxiangtui.pension.service.PensionComparisonService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 养老金相关接口控制器
 */
@Api(tags = "养老金计算相关接口")
@RestController
@RequestMapping("/api/v1/pension")
@CrossOrigin
public class PensionController {

    @Autowired
    private PensionCalculateService pensionCalculateService;

    @Autowired
    private PensionAdjustmentService pensionAdjustmentService;

    @Autowired
    private PensionComparisonService pensionComparisonService;

    /**
     * 1. 养老金待遇计算接口
     */
    @ApiOperation("养老金待遇计算")
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculatePension(
            @Validated @RequestBody PensionCalculateRequest request) {
        
        Map<String, Object> result = new HashMap<>();
        try {
            PensionCalculateResponse data = pensionCalculateService.calculatePension(request);
            result.put("code", 200);
            result.put("message", "success");
            result.put("data", data);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "计算失败：" + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 2. 待遇调整预测接口
     */
    @ApiOperation("待遇调整预测")
    @PostMapping("/adjustment-forecast")
    public ResponseEntity<Map<String, Object>> adjustmentForecast(
            @Validated @RequestBody PensionAdjustmentRequest request) {
        
        Map<String, Object> result = new HashMap<>();
        try {
            PensionAdjustmentResponse data = pensionAdjustmentService.calculateAdjustment(request);
            result.put("code", 200);
            result.put("message", "success");
            result.put("data", data);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "计算失败：" + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 3. 多方案对比接口
     */
    @ApiOperation("多方案对比")
    @PostMapping("/scheme-comparison")
    public ResponseEntity<Map<String, Object>> schemeComparison(
            @Validated @RequestBody PensionComparisonRequest request) {
        
        Map<String, Object> result = new HashMap<>();
        try {
            PensionComparisonResponse data = pensionComparisonService.calculateComparison(request);
            result.put("code", 200);
            result.put("message", "success");
            result.put("data", data);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "计算失败：" + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }
}
