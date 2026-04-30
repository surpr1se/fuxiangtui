package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.PensionCalculateResult;
import com.fuxiangtui.service.PensionCalculateResultService;
import com.fuxiangtui.engine.PensionCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/pension")
@RequiredArgsConstructor
public class PensionController {

    private final PensionCalculateResultService pensionCalculateResultService;
    private final PensionCalculator pensionCalculator;

    @PostMapping("/calculate")
    public Result<?> calculate(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> params) {
        String batchNo = (String) params.get("batchNo");
        Map<String, Object> supplementInfo = (Map<String, Object>) params.get("supplementInfo");

        PensionCalculateResult result = pensionCalculator.calculate(userId, batchNo, supplementInfo);
        pensionCalculateResultService.save(result);

        return Result.ok(Map.of(
            "calculateNo", result.getCalculateNo(),
            "basicPension", result.getBasicPension(),
            "personalAccountPension", result.getPersonalAccountPension(),
            "transitionalPension", result.getTransitionalPension(),
            "totalMonthlyPension", result.getTotalMonthlyPension(),
            "calculationProcess", result.getCalculationProcess(),
            "warnings", result.getWarnings()
        ));
    }

    @GetMapping("/result/{id}")
    public Result<?> getResult(@PathVariable Long id) {
        return Result.ok(pensionCalculateResultService.getById(id));
    }

    @GetMapping("/result/list")
    public Result<?> resultList(@RequestAttribute("userId") Long userId,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "10") int size) {
        Page<PensionCalculateResult> pageResult = pensionCalculateResultService.page(
            new Page<>(page, size),
            new LambdaQueryWrapper<PensionCalculateResult>()
                .eq(PensionCalculateResult::getUserId, userId)
                .orderByDesc(PensionCalculateResult::getCalculateTime)
        );
        return Result.ok(pageResult);
    }

    @DeleteMapping("/result/{id}")
    public Result<?> deleteResult(@RequestAttribute("userId") Long userId, @PathVariable Long id) {
        pensionCalculateResultService.removeById(id);
        return Result.ok();
    }

    @PostMapping("/result/{id}/share")
    public Result<?> shareResult(@PathVariable Long id) {
        // TODO: 生成分享链接/卡片图片
        return Result.ok(Map.of("shareUrl", "/pension/result/" + id, "cardImageUrl", ""));
    }
}
