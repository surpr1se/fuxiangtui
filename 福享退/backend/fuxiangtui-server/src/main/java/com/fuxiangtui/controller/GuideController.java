package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.RetirementGuide;
import com.fuxiangtui.service.RetirementGuideService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/guide")
@RequiredArgsConstructor
public class GuideController {

    private final RetirementGuideService retirementGuideService;

    @GetMapping("/process")
    public Result<?> getProcess() {
        List<RetirementGuide> list = retirementGuideService.list(
            new LambdaQueryWrapper<RetirementGuide>()
                .eq(RetirementGuide::getCategory, "PROCESS")
                .eq(RetirementGuide::getIsActive, 1)
                .orderByAsc(RetirementGuide::getSortOrder)
        );
        return Result.ok(list);
    }

    @GetMapping("/offices")
    public Result<?> getOffices(@RequestParam(required = false) String city) {
        LambdaQueryWrapper<RetirementGuide> wrapper = new LambdaQueryWrapper<RetirementGuide>()
            .eq(RetirementGuide::getCategory, "OFFICE")
            .eq(RetirementGuide::getIsActive, 1)
            .orderByAsc(RetirementGuide::getSortOrder);
        if (city != null && !city.isEmpty()) {
            wrapper.eq(RetirementGuide::getCity, city);
        }
        return Result.ok(retirementGuideService.list(wrapper));
    }

    @GetMapping("/faq")
    public Result<?> getFaq() {
        List<RetirementGuide> list = retirementGuideService.list(
            new LambdaQueryWrapper<RetirementGuide>()
                .eq(RetirementGuide::getCategory, "FAQ")
                .eq(RetirementGuide::getIsActive, 1)
                .orderByAsc(RetirementGuide::getSortOrder)
        );
        return Result.ok(list);
    }

    @GetMapping("/materials/{personType}")
    public Result<?> getMaterials(@PathVariable String personType) {
        List<RetirementGuide> list = retirementGuideService.list(
            new LambdaQueryWrapper<RetirementGuide>()
                .eq(RetirementGuide::getCategory, "MATERIAL")
                .eq(RetirementGuide::getPersonType, personType)
                .eq(RetirementGuide::getIsActive, 1)
                .orderByAsc(RetirementGuide::getSortOrder)
        );
        return Result.ok(list);
    }
}
