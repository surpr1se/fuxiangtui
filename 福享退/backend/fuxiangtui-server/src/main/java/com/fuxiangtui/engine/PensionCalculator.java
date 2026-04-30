package com.fuxiangtui.engine;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.entity.*;
import com.fuxiangtui.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class PensionCalculator {

    private final PaymentDetailService paymentDetailService;
    private final SysParameterService sysParameterService;
    private final CalculationMonthService calculationMonthService;

    public PensionCalculateResult calculate(Long userId, String batchNo, Map<String, Object> supplementInfo) {
        List<PaymentDetail> details = paymentDetailService.list(
            new LambdaQueryWrapper<PaymentDetail>().eq(PaymentDetail::getBatchNo, batchNo).orderByAsc(PaymentDetail::getYearMonth)
        );

        // 从补充信息取参数
        String retirementIdentity = (String) supplementInfo.getOrDefault("retirementIdentity", "男性");
        int retirementAge = ((Number) supplementInfo.getOrDefault("retirementAge", 60)).intValue();
        int retirementYear = ((Number) supplementInfo.getOrDefault("retirementYear", 2026)).intValue();
        BigDecimal visualPaymentYears = new BigDecimal(supplementInfo.getOrDefault("visualPaymentYears", "0").toString());
        BigDecimal personalAccountAmount = supplementInfo.containsKey("personalAccountAmount") && supplementInfo.get("personalAccountAmount") != null
            ? new BigDecimal(supplementInfo.get("personalAccountAmount").toString()) : null;

        // 计算累计缴费月数
        int totalMonths = details.stream().mapToInt(PaymentDetail::getPaymentMonths).sum();
        BigDecimal actualPaymentYears = convertMonthsToYears(totalMonths);
        BigDecimal totalPaymentYears = actualPaymentYears.add(visualPaymentYears);

        // 获取社平工资
        String avgWageStr = sysParameterService.getOne(
            new LambdaQueryWrapper<SysParameter>()
                .eq(SysParameter::getParamType, "SOCIAL_AVG_WAGE")
                .eq(SysParameter::getEffectiveYear, retirementYear - 1)
        ).getParamValue();
        BigDecimal socialAvgWage = new BigDecimal(avgWageStr);

        // 计算平均缴费指数
        BigDecimal avgIndex = calculateAvgIndex(details, retirementYear);

        // 指数化月平均缴费工资
        BigDecimal indexedWage = socialAvgWage.multiply(avgIndex).setScale(2, RoundingMode.HALF_UP);

        // 基础养老金 = (社平工资 + 指数化工资) / 2 * 缴费年限 * 1%
        BigDecimal basicPension = socialAvgWage.add(indexedWage)
            .divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP)
            .multiply(totalPaymentYears)
            .multiply(new BigDecimal("0.01"))
            .setScale(2, RoundingMode.HALF_UP);

        // 获取计发月数
        int monthCount = getCalculationMonths(retirementAge);

        // 个人账户养老金
        if (personalAccountAmount == null) {
            // 估算个人账户：缴费基数*8%*月数
            BigDecimal totalBase = details.stream().map(PaymentDetail::getPaymentBase).reduce(BigDecimal.ZERO, BigDecimal::add);
            personalAccountAmount = totalBase.multiply(new BigDecimal("0.08"));
        }
        BigDecimal personalAccountPension = personalAccountAmount
            .divide(new BigDecimal(monthCount), 2, RoundingMode.HALF_UP);

        // 过渡性养老金 = 指数化工资 * 建账前缴费年限 * 1.3%
        BigDecimal transitionalPension = visualPaymentYears.compareTo(BigDecimal.ZERO) > 0
            ? indexedWage.multiply(visualPaymentYears).multiply(new BigDecimal("0.013")).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // 限高金额（保底机制）
        BigDecimal totalPension = basicPension.add(personalAccountPension).add(transitionalPension);

        // 组装结果
        PensionCalculateResult result = new PensionCalculateResult();
        result.setUserId(userId);
        result.setBatchNo(batchNo);
        result.setCalculateNo("C" + System.currentTimeMillis());
        result.setRetirementIdentity(retirementIdentity);
        result.setRetirementAge(retirementAge);
        result.setRetirementYear(retirementYear);
        result.setActualPaymentYears(actualPaymentYears);
        result.setVisualPaymentYears(visualPaymentYears);
        result.setTotalPaymentYears(totalPaymentYears);
        result.setAveragePaymentIndex(avgIndex);
        result.setPersonalAccountAmount(personalAccountAmount);
        result.setBasicPension(basicPension);
        result.setPersonalAccountPension(personalAccountPension);
        result.setTransitionalPension(transitionalPension);
        result.setPaymentYearsPension(BigDecimal.ZERO);
        result.setTotalMonthlyPension(totalPension);
        result.setPensionType("ENTERPRISE");
        result.setCalculateTime(LocalDateTime.now());
        result.setCalculateVersion("V1.0");
        result.setSocialAvgWageYear(retirementYear - 1);
        result.setIsShared(0);

        // 构造计算过程JSON
        String process = String.format(
            "{\"socialAvgWage\":%s, \"avgIndex\":%s, \"indexedWage\":%s, \"totalPaymentYears\":%s, \"monthCount\":%d, \"personalAccountAmount\":%s}",
            socialAvgWage, avgIndex, indexedWage, totalPaymentYears, monthCount, personalAccountAmount
        );
        result.setCalculationProcess(process);

        // 缴费不足15年预警
        List<String> warnings = new ArrayList<>();
        if (totalPaymentYears.compareTo(new BigDecimal("15")) < 0) {
            warnings.add("累计缴费不足15年，无法按月领取养老金");
        }
        result.setWarnings(warnings.isEmpty() ? null : String.join(";", warnings));

        return result;
    }

    private BigDecimal convertMonthsToYears(int months) {
        int years = months / 12;
        int remainMonths = months % 12;
        BigDecimal decimal;
        if (remainMonths >= 1 && remainMonths <= 6) {
            decimal = new BigDecimal("0.5");
        } else if (remainMonths >= 7) {
            decimal = BigDecimal.ONE;
        } else {
            decimal = BigDecimal.ZERO;
        }
        return new BigDecimal(years).add(decimal);
    }

    private BigDecimal calculateAvgIndex(List<PaymentDetail> details, int retirementYear) {
        if (details.isEmpty()) return BigDecimal.ONE;
        // 简化计算：平均缴费基数 / 社平工资
        BigDecimal avgBase = details.stream()
            .map(PaymentDetail::getPaymentBase)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(details.size()), 4, RoundingMode.HALF_UP);

        SysParameter avgWageParam = sysParameterService.getOne(
            new LambdaQueryWrapper<SysParameter>()
                .eq(SysParameter::getParamType, "SOCIAL_AVG_WAGE")
                .eq(SysParameter::getEffectiveYear, retirementYear - 1)
        );
        if (avgWageParam == null) return BigDecimal.ONE;
        BigDecimal avgWage = new BigDecimal(avgWageParam.getParamValue());
        BigDecimal index = avgBase.divide(avgWage, 4, RoundingMode.HALF_UP);
        // 保底0.75
        return index.compareTo(new BigDecimal("0.75")) < 0 ? new BigDecimal("0.75") : index;
    }

    private int getCalculationMonths(int retirementAge) {
        CalculationMonth cm = calculationMonthService.getOne(
            new LambdaQueryWrapper<CalculationMonth>().eq(CalculationMonth::getRetirementAge, retirementAge)
        );
        return cm != null ? cm.getMonthCount() : 139; // 默认60岁139个月
    }
}
