package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.CalculatePlan;
import com.fuxiangtui.service.CalculatePlanService;
import com.fuxiangtui.service.PensionCalculateResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/plan")
@RequiredArgsConstructor
public class PlanController {

    private final CalculatePlanService calculatePlanService;
    private final PensionCalculateResultService pensionCalculateResultService;

    @PostMapping("/save")
    public Result<?> savePlan(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> params) {
        CalculatePlan plan = new CalculatePlan();
        plan.setUserId(userId);
        plan.setPlanName((String) params.getOrDefault("planName", "方案" + System.currentTimeMillis()));
        plan.setBatchNo((String) params.get("batchNo"));
        plan.setResultId(Long.valueOf(params.get("resultId").toString()));
        plan.setSupplementInfoJson(params.containsKey("supplementInfo") ? params.get("supplementInfo").toString() : null);
        calculatePlanService.save(plan);
        return Result.ok(Map.of("planId", plan.getId()));
    }

    @GetMapping("/list")
    public Result<?> listPlans(@RequestAttribute("userId") Long userId,
                               @RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "10") int size) {
        return Result.ok(calculatePlanService.page(
            new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size),
            new LambdaQueryWrapper<CalculatePlan>().eq(CalculatePlan::getUserId, userId).orderByDesc(CalculatePlan::getCreateTime)
        ));
    }

    @GetMapping("/{planId}")
    public Result<?> getPlan(@PathVariable Long planId) {
        return Result.ok(calculatePlanService.getById(planId));
    }

    @PutMapping("/{planId}")
    public Result<?> renamePlan(@PathVariable Long planId, @RequestBody Map<String, String> params) {
        CalculatePlan plan = new CalculatePlan();
        plan.setId(planId);
        plan.setPlanName(params.get("planName"));
        calculatePlanService.updateById(plan);
        return Result.ok();
    }

    @DeleteMapping("/{planId}")
    public Result<?> deletePlan(@PathVariable Long planId) {
        calculatePlanService.removeById(planId);
        return Result.ok();
    }

    @PostMapping("/compare")
    public Result<?> comparePlans(@RequestBody Map<String, Object> params) {
        List<Long> planIds = (List<Long>) params.get("planIds");
        if (planIds == null || planIds.size() < 2 || planIds.size() > 3) {
            return Result.fail("请选择2-3个方案进行对比");
        }
        List<CalculatePlan> plans = calculatePlanService.listByIds(planIds);
        return Result.ok(Map.of("plans", plans));
    }

    @PostMapping("/load/{planId}")
    public Result<?> loadPlan(@PathVariable Long planId) {
        CalculatePlan plan = calculatePlanService.getById(planId);
        if (plan == null) return Result.fail("方案不存在");
        return Result.ok(plan);
    }
}
