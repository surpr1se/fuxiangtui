package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.SysParameter;
import com.fuxiangtui.entity.CalculationMonth;
import com.fuxiangtui.service.SysParameterService;
import com.fuxiangtui.service.CalculationMonthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemController {

    private final SysParameterService sysParameterService;
    private final CalculationMonthService calculationMonthService;

    @GetMapping("/parameters")
    public Result<?> getParameters(@RequestParam(required = false) String paramType,
                                   @RequestParam(required = false) Integer effectiveYear) {
        LambdaQueryWrapper<SysParameter> wrapper = new LambdaQueryWrapper<>();
        if (paramType != null) wrapper.eq(SysParameter::getParamType, paramType);
        if (effectiveYear != null) wrapper.eq(SysParameter::getEffectiveYear, effectiveYear);
        return Result.ok(sysParameterService.list(wrapper));
    }

    @GetMapping("/calculation-months")
    public Result<?> getCalculationMonths() {
        return Result.ok(calculationMonthService.list());
    }
}
