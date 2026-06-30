package com.fuxiangtui.pension.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 多方案对比响应DTO
 */
@Data
public class PensionComparisonResponse {

    /**
     * 方案列表
     */
    private List<PensionScheme> schemes;

    /**
     * 分析建议
     */
    private String recommendation;

    @Data
    public static class PensionScheme {
        /**
         * 方案名称
         */
        private String schemeName;

        /**
         * 缴费档次（相对于社平）
         */
        private String paymentLevel;

        /**
         * 每月个人缴费（元）
         */
        private BigDecimal monthlyPayment;

        /**
         * 剩余缴费总额（元）
         */
        private BigDecimal remainingTotalPayment;

        /**
         * 每月养老金（元）
         */
        private BigDecimal monthlyPension;

        /**
         * 年化收益率（%）
         */
        private BigDecimal annualReturnRate;

        /**
         * 回本年龄（岁）
         */
        private BigDecimal breakEvenAge;

        /**
         * 回本月数
         */
        private Integer breakEvenMonths;
    }
}
