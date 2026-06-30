package com.fuxiangtui.pension.service;

import com.fuxiangtui.pension.dto.request.PensionAdjustmentRequest;
import com.fuxiangtui.pension.dto.response.PensionAdjustmentResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * 待遇调整预测服务
 */
@Service
public class PensionAdjustmentService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 计算待遇调整预测
     * 每年4.5%增长，计算到各年龄节点的领取金额和累计总额
     */
    public PensionAdjustmentResponse calculateAdjustment(PensionAdjustmentRequest request) {
        PensionAdjustmentResponse response = new PensionAdjustmentResponse();

        LocalDate birthDate = LocalDate.parse(request.getBirthDate(), FORMATTER);
        LocalDate retireDate = LocalDate.parse(request.getRetireDate(), FORMATTER);
        BigDecimal initialPension = request.getInitialMonthlyPension();
        BigDecimal growthRate = request.getAnnualGrowthRate() != null 
            ? request.getAnnualGrowthRate() : new BigDecimal("0.045");

        response.setInitialMonthlyPension(initialPension);
        response.setAnnualGrowthRate(growthRate);

        // 计算退休时的年龄
        long retireAgeYears = ChronoUnit.YEARS.between(birthDate, retireDate);
        int retireYear = retireDate.getYear();

        // 生成各年度明细
        List<PensionAdjustmentResponse.YearlyAdjustmentDetail> yearlyDetails = new ArrayList<>();
        BigDecimal totalReceived70 = BigDecimal.ZERO;
        BigDecimal totalReceived80 = BigDecimal.ZERO;
        BigDecimal totalReceived90 = BigDecimal.ZERO;

        BigDecimal currentMonthlyPension = initialPension;

        // 计算到90岁
        for (int i = 0; i <= 90 - retireAgeYears; i++) {
            int currentYear = retireYear + i;
            int currentAge = (int) retireAgeYears + i;

            // 每年调整一次（退休当年不调整，从第二年开始）
            if (i > 0) {
                currentMonthlyPension = currentMonthlyPension.multiply(BigDecimal.ONE.add(growthRate))
                    .setScale(2, RoundingMode.HALF_UP);
            }

            BigDecimal yearlyTotal = currentMonthlyPension.multiply(new BigDecimal("12"))
                .setScale(2, RoundingMode.HALF_UP);

            // 记录年龄节点
            if (currentAge == 65) {
                response.setAge65MonthlyPension(currentMonthlyPension);
            }
            if (currentAge == 70) {
                response.setAge70MonthlyPension(currentMonthlyPension);
            }
            if (currentAge == 75) {
                response.setAge75MonthlyPension(currentMonthlyPension);
            }

            // 累计计算
            if (currentAge <= 70) {
                totalReceived70 = totalReceived70.add(yearlyTotal);
            }
            if (currentAge <= 80) {
                totalReceived80 = totalReceived80.add(yearlyTotal);
            }
            if (currentAge <= 90) {
                totalReceived90 = totalReceived90.add(yearlyTotal);
            }

            PensionAdjustmentResponse.YearlyAdjustmentDetail detail = new PensionAdjustmentResponse.YearlyAdjustmentDetail();
            detail.setYear(currentYear);
            detail.setAge(currentAge);
            detail.setMonthlyPension(currentMonthlyPension);
            detail.setYearlyTotal(yearlyTotal);
            yearlyDetails.add(detail);
        }

        response.setAge70TotalReceived(totalReceived70.setScale(2, RoundingMode.HALF_UP));
        response.setAge80TotalReceived(totalReceived80.setScale(2, RoundingMode.HALF_UP));
        response.setAge90TotalReceived(totalReceived90.setScale(2, RoundingMode.HALF_UP));
        response.setYearlyDetails(yearlyDetails);

        return response;
    }
}
