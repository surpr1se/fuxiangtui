package com.fuxiangtui.pension.service;

import com.fuxiangtui.pension.dto.request.PensionComparisonRequest;
import com.fuxiangtui.pension.dto.response.PensionComparisonResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 多方案对比服务
 * 对比不同缴费档次的养老金收益
 */
@Service
public class PensionComparisonService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final BigDecimal PERSONAL_PAYMENT_RATE = new BigDecimal("0.08"); // 个人缴费比例8%

    @Autowired
    private PensionCalculateService pensionCalculateService;

    /**
     * 计算多方案对比
     */
    public PensionComparisonResponse calculateComparison(PensionComparisonRequest request) {
        PensionComparisonResponse response = new PensionComparisonResponse();
        List<PensionComparisonResponse.PensionScheme> schemes = new ArrayList<>();

        BigDecimal socialAverageWage = request.getSocialAverageWage() != null 
            ? request.getSocialAverageWage() : new BigDecimal("6000");
        BigDecimal currentPaymentBase = request.getCurrentPaymentBase() != null 
            ? request.getCurrentPaymentBase() : socialAverageWage;
        BigDecimal personalAccountAmount = request.getPersonalAccountAmount() != null 
            ? request.getPersonalAccountAmount() : new BigDecimal("50000");
        BigDecimal paidYears = request.getPaidYears() != null 
            ? request.getPaidYears() : new BigDecimal("10");
        BigDecimal remainingYears = request.getRemainingYears() != null 
            ? request.getRemainingYears() : new BigDecimal("5");

        // 方案1：继续使用现有基数缴费
        schemes.add(calculateScheme("现有基数缴费", currentPaymentBase, socialAverageWage, 
            personalAccountAmount, paidYears, remainingYears, request.getPersonType()));

        // 方案2：60%社平缴费
        BigDecimal base60 = socialAverageWage.multiply(new BigDecimal("0.6"));
        schemes.add(calculateScheme("60%社平缴费", base60, socialAverageWage,
            personalAccountAmount, paidYears, remainingYears, request.getPersonType()));

        // 方案3：100%社平缴费
        schemes.add(calculateScheme("100%社平缴费", socialAverageWage, socialAverageWage,
            personalAccountAmount, paidYears, remainingYears, request.getPersonType()));

        // 方案4：300%社平缴费
        BigDecimal base300 = socialAverageWage.multiply(new BigDecimal("3.0"));
        schemes.add(calculateScheme("300%社平缴费", base300, socialAverageWage,
            personalAccountAmount, paidYears, remainingYears, request.getPersonType()));

        response.setSchemes(schemes);

        // 生成建议
        String recommendation = generateRecommendation(schemes);
        response.setRecommendation(recommendation);

        return response;
    }

    /**
     * 计算单个方案
     */
    private PensionComparisonResponse.PensionScheme calculateScheme(
            String schemeName,
            BigDecimal paymentBase,
            BigDecimal socialAverageWage,
            BigDecimal existingAccountAmount,
            BigDecimal paidYears,
            BigDecimal remainingYears,
            Integer personType) {

        PensionComparisonResponse.PensionScheme scheme = new PensionComparisonResponse.PensionScheme();
        scheme.setSchemeName(schemeName);

        // 1. 缴费档次
        BigDecimal paymentLevel = paymentBase.divide(socialAverageWage, 2, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        scheme.setPaymentLevel(paymentLevel.intValue() + "%");

        // 2. 每月个人缴费
        BigDecimal monthlyPayment = paymentBase.multiply(PERSONAL_PAYMENT_RATE)
            .setScale(2, RoundingMode.HALF_UP);
        scheme.setMonthlyPayment(monthlyPayment);

        // 3. 剩余缴费总额
        BigDecimal remainingMonths = remainingYears.multiply(new BigDecimal("12"));
        BigDecimal remainingTotalPayment = monthlyPayment.multiply(remainingMonths)
            .setScale(2, RoundingMode.HALF_UP);
        scheme.setRemainingTotalPayment(remainingTotalPayment);

        // 4. 预测个人账户总额（现有+剩余缴费）
        BigDecimal futurePersonalAccount = existingAccountAmount.add(remainingTotalPayment);

        // 5. 计算每月养老金（简化计算）
        BigDecimal totalYears = paidYears.add(remainingYears);
        BigDecimal averagePaymentIndex = paymentBase.divide(socialAverageWage, 2, RoundingMode.HALF_UP);

        // 基础养老金 = (社平 + 指数化工资) / 2 * 缴费年限 * 1%
        BigDecimal indexedWage = socialAverageWage.multiply(averagePaymentIndex);
        BigDecimal avgBase = socialAverageWage.add(indexedWage).divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        BigDecimal basicPension = avgBase.multiply(totalYears).multiply(new BigDecimal("0.01"))
            .setScale(2, RoundingMode.HALF_UP);

        // 个人账户养老金 = 账户总额 / 计发月数（假设60岁退休139个月）
        int paymentMonths = 139;
        BigDecimal personalPension = futurePersonalAccount
            .divide(new BigDecimal(paymentMonths), 2, RoundingMode.HALF_UP);

        BigDecimal monthlyPension = basicPension.add(personalPension)
            .setScale(2, RoundingMode.HALF_UP);
        scheme.setMonthlyPension(monthlyPension);

        // 6. 回本年龄
        if (monthlyPension.compareTo(BigDecimal.ZERO) > 0) {
            // 回本月数 = 总投入 / 每月养老金
            BigDecimal totalInvestment = existingAccountAmount.add(remainingTotalPayment);
            BigDecimal breakEvenMonths = totalInvestment.divide(monthlyPension, 2, RoundingMode.HALF_UP);
            scheme.setBreakEvenMonths(breakEvenMonths.intValue());

            // 回本年龄 = 退休年龄(假设60) + 回本月数/12
            BigDecimal breakEvenAge = new BigDecimal("60").add(
                breakEvenMonths.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP));
            scheme.setBreakEvenAge(breakEvenAge);

            // 7. 年化收益率（简化计算：假设领取20年）
            BigDecimal totalReceive20Years = monthlyPension.multiply(new BigDecimal("240"));
            BigDecimal annualReturnRate = calculateAnnualReturn(totalInvestment, totalReceive20Years, 20);
            scheme.setAnnualReturnRate(annualReturnRate);
        } else {
            scheme.setBreakEvenAge(new BigDecimal("999"));
            scheme.setAnnualReturnRate(BigDecimal.ZERO);
        }

        return scheme;
    }

    /**
     * 简化计算年化收益率
     */
    private BigDecimal calculateAnnualReturn(BigDecimal principal, BigDecimal totalReturn, int years) {
        if (principal.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return BigDecimal.ZERO;
        }
        // 简化：(总回报/本金)^(1/年数) - 1
        double ratio = totalReturn.doubleValue() / principal.doubleValue();
        double annualReturn = (Math.pow(ratio, 1.0 / years) - 1) * 100;
        return new BigDecimal(annualReturn).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * 生成投资建议
     */
    private String generateRecommendation(List<PensionComparisonResponse.PensionScheme> schemes) {
        StringBuilder sb = new StringBuilder();

        // 找到回本最早的方案
        PensionComparisonResponse.PensionScheme earliestBreakEven = schemes.stream()
            .min(Comparator.comparing(PensionComparisonResponse.PensionScheme::getBreakEvenAge))
            .orElse(null);

        // 找到收益率最高的方案
        PensionComparisonResponse.PensionScheme highestReturn = schemes.stream()
            .max(Comparator.comparing(PensionComparisonResponse.PensionScheme::getAnnualReturnRate))
            .orElse(null);

        // 找到养老金最高的方案
        PensionComparisonResponse.PensionScheme highestPension = schemes.stream()
            .max(Comparator.comparing(PensionComparisonResponse.PensionScheme::getMonthlyPension))
            .orElse(null);

        sb.append("【方案分析建议】\n");
        if (earliestBreakEven != null) {
            sb.append("✓ 回本最快：").append(earliestBreakEven.getSchemeName())
                .append("（").append(earliestBreakEven.getBreakEvenAge()).append("岁）\n");
        }
        if (highestReturn != null) {
            sb.append("✓ 收益最高：").append(highestReturn.getSchemeName())
                .append("（年化").append(highestReturn.getAnnualReturnRate()).append("%）\n");
        }
        if (highestPension != null) {
            sb.append("✓ 养老金最高：").append(highestPension.getSchemeName())
                .append("（每月").append(highestPension.getMonthlyPension()).append("元）\n");
        }

        sb.append("\n建议：如果希望尽快回本，选择").append(earliestBreakEven != null ? earliestBreakEven.getSchemeName() : "")
            .append("；如果希望退休后每月领取更多，选择").append(highestPension != null ? highestPension.getSchemeName() : "")
            .append("。请根据自身经济状况和预期寿命综合选择。");

        return sb.toString();
    }
}
