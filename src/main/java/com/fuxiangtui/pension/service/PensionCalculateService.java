package com.fuxiangtui.pension.service;

import com.fuxiangtui.pension.dto.request.PensionCalculateRequest;
import com.fuxiangtui.pension.dto.response.PensionCalculateResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * 养老金计算服务
 */
@Service
public class PensionCalculateService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 计算养老金
     */
    public PensionCalculateResponse calculatePension(PensionCalculateRequest request) {
        PensionCalculateResponse response = new PensionCalculateResponse();

        // 1. 基础信息
        LocalDate birthDate = LocalDate.parse(request.getBirthDate(), FORMATTER);
        response.setBirthDate(request.getBirthDate());

        // 2. 默认参数处理
        BigDecimal paymentYears = request.getPaymentYears() != null 
            ? request.getPaymentYears() : new BigDecimal("15.0");
        BigDecimal personalAccountAmount = request.getPersonalAccountAmount() != null 
            ? request.getPersonalAccountAmount() : new BigDecimal("50000");
        BigDecimal averagePaymentIndex = request.getAveragePaymentIndex() != null 
            ? request.getAveragePaymentIndex() : new BigDecimal("1.0");
        BigDecimal socialAverageWage = request.getSocialAverageWage() != null 
            ? request.getSocialAverageWage() : new BigDecimal("6000");

        response.setPaymentYears(paymentYears);
        response.setPersonalAccountAmount(personalAccountAmount);

        // 3. 计算退休年龄（简化，实际应该调用退休年龄计算接口）
        int retireAgeYear = getRetireAgeYear(request.getPersonType());
        int retireAgeMonth = 0;
        LocalDate retireDate = birthDate.plusYears(retireAgeYear).plusMonths(retireAgeMonth);
        response.setRetireDate(retireDate.format(FORMATTER));
        response.setRetireAge(new BigDecimal(retireAgeYear));

        // 4. 计算计发月数（根据退休年龄）
        int paymentMonths = getPaymentMonths(retireAgeYear);
        response.setPaymentMonths(paymentMonths);

        // 5. 计算基础养老金
        // 基础养老金 = (退休时上年度社平工资 + 本人指数化月平均缴费工资) ÷ 2 × 累计缴费年限 × 1%
        BigDecimal indexedAverageWage = socialAverageWage.multiply(averagePaymentIndex);
        BigDecimal averageWageBase = socialAverageWage.add(indexedAverageWage).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        BigDecimal basicPension = averageWageBase.multiply(paymentYears).multiply(new BigDecimal("0.01"))
            .setScale(2, RoundingMode.HALF_UP);
        response.setBasicPension(basicPension);

        // 6. 计算个人账户养老金
        // 个人账户养老金 = 个人账户累计储存额 ÷ 计发月数
        BigDecimal personalAccountPension = personalAccountAmount
            .divide(new BigDecimal(paymentMonths), 2, RoundingMode.HALF_UP);
        response.setPersonalAccountPension(personalAccountPension);

        // 7. 计算每月基本养老金总额
        BigDecimal monthlyPension = basicPension.add(personalAccountPension)
            .setScale(2, RoundingMode.HALF_UP);
        response.setMonthlyPension(monthlyPension);

        response.setRemark(String.format("基础养老金%s元 + 个人账户养老金%s元 = 每月合计%s元",
            basicPension, personalAccountPension, monthlyPension));

        return response;
    }

    /**
     * 获取退休年龄（简化版，实际应从sys_retire_age_mapping表查询）
     */
    private int getRetireAgeYear(Integer personType) {
        if (personType == null) {
            return 60;
        }
        switch (personType) {
            case 11: // 女工人
                return 50;
            case 12: // 女干部
            case 13: // 女性灵活就业
                return 55;
            case 21: // 男性
            default:
                return 60;
        }
    }

    /**
     * 获取计发月数（根据退休年龄）
     */
    private int getPaymentMonths(int retireAge) {
        if (retireAge <= 50) return 195;
        if (retireAge <= 55) return 170;
        if (retireAge <= 60) return 139;
        if (retireAge <= 65) return 101;
        return 101;
    }
}
