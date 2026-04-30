package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.PensionAdjustmentPredict;
import com.fuxiangtui.entity.DelayedRetirementRecord;
import com.fuxiangtui.entity.PensionCalculateResult;
import com.fuxiangtui.service.PensionAdjustmentPredictService;
import com.fuxiangtui.service.DelayedRetirementRecordService;
import com.fuxiangtui.service.PensionCalculateResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@RestController
@RequestMapping("/api/v1/pension")
@RequiredArgsConstructor
public class PensionAdvancedController {

    private final PensionAdjustmentPredictService predictService;
    private final DelayedRetirementRecordService delayedService;
    private final PensionCalculateResultService resultService;

    @PostMapping("/adjustment-predict")
    public Result<?> adjustmentPredict(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> params) {
        Long resultId = Long.valueOf(params.get("resultId").toString());
        int predictLifeAge = params.containsKey("predictLifeAge") ? ((Number) params.get("predictLifeAge")).intValue() : 85;
        BigDecimal annualRate = params.containsKey("annualIncreaseRate")
            ? new BigDecimal(params.get("annualIncreaseRate").toString()) : new BigDecimal("0.04");

        PensionCalculateResult result = resultService.getById(resultId);
        if (result == null) return Result.fail("计算结果不存在");

        List<Map<String, Object>> nodes = new ArrayList<>();
        BigDecimal monthly = result.getTotalMonthlyPension();
        BigDecimal cumulative = BigDecimal.ZERO;
        for (int age = result.getRetirementAge(); age <= predictLifeAge; age++) {
            nodes.add(Map.of("age", age, "monthlyPension", monthly, "cumulativeAmount", cumulative));
            cumulative = cumulative.add(monthly.multiply(new BigDecimal("12")));
            monthly = monthly.multiply(BigDecimal.ONE.add(annualRate)).setScale(2, RoundingMode.HALF_UP);
        }

        // 缓存
        PensionAdjustmentPredict predict = new PensionAdjustmentPredict();
        predict.setUserId(userId);
        predict.setResultId(resultId);
        predict.setPredictLifeAge(predictLifeAge);
        predict.setAnnualIncreaseRate(annualRate);
        predict.setPredictDataJson(nodes.toString());
        predictService.save(predict);

        return Result.ok(Map.of("nodes", nodes));
    }

    @GetMapping("/adjustment-predict-config")
    public Result<?> predictConfig() {
        return Result.ok(Map.of(
            "defaultLifeAge", 85,
            "defaultIncreaseRate", 0.04,
            "minRate", 0.01,
            "maxRate", 0.08
        ));
    }

    @PostMapping("/payback-analysis")
    public Result<?> paybackAnalysis(@RequestBody Map<String, Object> params) {
        Long resultId = Long.valueOf(params.get("resultId").toString());
        PensionCalculateResult result = resultService.getById(resultId);
        if (result == null) return Result.fail("计算结果不存在");

        // 估算个人缴费总额：缴费基数*8%*月数
        BigDecimal totalPayment = result.getTotalPersonalPayment() != null
            ? result.getTotalPersonalPayment() : result.getPersonalAccountAmount();

        BigDecimal monthlyPension = result.getTotalMonthlyPension();
        int paybackMonths = totalPayment.divide(monthlyPension, 0, RoundingMode.UP).intValue();
        double paybackAge = result.getRetirementAge() + paybackMonths / 12.0;

        List<Map<String, Object>> yearlyBreakdown = new ArrayList<>();
        BigDecimal cumulativeReceived = BigDecimal.ZERO;
        for (int year = 1; result.getRetirementAge() + year <= 85; year++) {
            cumulativeReceived = cumulativeReceived.add(monthlyPension.multiply(new BigDecimal("12")));
            yearlyBreakdown.add(Map.of(
                "year", year,
                "age", result.getRetirementAge() + year,
                "cumulativeReceived", cumulativeReceived,
                "diffWithPayment", cumulativeReceived.subtract(totalPayment)
            ));
        }

        return Result.ok(Map.of(
            "totalPersonalPayment", totalPayment,
            "paybackMonths", paybackMonths,
            "paybackAge", paybackAge,
            "annualROI", monthlyPension.multiply(new BigDecimal("12")).divide(totalPayment, 4, RoundingMode.HALF_UP),
            "yearlyBreakdown", yearlyBreakdown
        ));
    }

    @PostMapping("/delayed-retirement")
    public Result<?> delayedRetirement(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> params) {
        Long resultId = Long.valueOf(params.get("resultId").toString());
        String delayType = (String) params.getOrDefault("delayType", "YEAR_1");
        int delayMonths = params.containsKey("delayMonths") ? ((Number) params.get("delayMonths")).intValue() : 12;

        PensionCalculateResult original = resultService.getById(resultId);
        if (original == null) return Result.fail("计算结果不存在");

        // 简化的延迟退休影响计算
        int delayedAge = original.getRetirementAge() + delayMonths / 12;
        // 延迟后多缴费、计发月数减少，月养老金增加
        BigDecimal increaseRate = new BigDecimal(delayMonths).divide(new BigDecimal("12"), 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("0.06")); // 每延迟1年约增加6%
        BigDecimal delayedPension = original.getTotalMonthlyPension()
            .multiply(BigDecimal.ONE.add(increaseRate)).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> originalPlan = Map.of(
            "retirementAge", original.getRetirementAge(),
            "monthlyPension", original.getTotalMonthlyPension()
        );
        Map<String, Object> delayedPlan = Map.of(
            "retirementAge", delayedAge,
            "monthlyPension", delayedPension
        );

        // 保存记录
        DelayedRetirementRecord record = new DelayedRetirementRecord();
        record.setUserId(userId);
        record.setResultId(resultId);
        record.setDelayType(delayType);
        record.setDelayMonths(delayMonths);
        record.setOriginalResultJson(originalPlan.toString());
        record.setDelayedResultJson(delayedPlan.toString());
        record.setCrossoverAge(new BigDecimal(delayedAge + 3)); // 简化：交叉点约为延迟后3年
        record.setSuggestion("如果您身体健康，预期寿命超过" + (delayedAge + 5) + "岁，建议选择延迟退休可获得更高月养老金。");
        delayedService.save(record);

        return Result.ok(Map.of(
            "originalPlan", originalPlan,
            "delayedPlan", delayedPlan,
            "crossoverAge", record.getCrossoverAge(),
            "suggestion", record.getSuggestion()
        ));
    }
}
