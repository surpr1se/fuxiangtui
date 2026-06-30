package com.fuxiangtui.pension.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 待遇调整预测响应DTO
 */
@Data
public class PensionAdjustmentResponse {

    /**
     * 首月养老金
     */
    private BigDecimal initialMonthlyPension;

    /**
     * 年增长率
     */
    private BigDecimal annualGrowthRate;

    /**
     * 65岁时每月领取金额
     */
    private BigDecimal age65MonthlyPension;

    /**
     * 70岁时每月领取金额
     */
    private BigDecimal age70MonthlyPension;

    /**
     * 75岁时每月领取金额
     */
    private BigDecimal age75MonthlyPension;

    /**
     * 到70岁累计领取总额
     */
    private BigDecimal age70TotalReceived;

    /**
     * 到80岁累计领取总额
     */
    private BigDecimal age80TotalReceived;

    /**
     * 到90岁累计领取总额
     */
    private BigDecimal age90TotalReceived;

    /**
     * 年度明细数据
     */
    private List<YearlyAdjustmentDetail> yearlyDetails;

    @Data
    public static class YearlyAdjustmentDetail {
        /**
         * 年份
         */
        private Integer year;

        /**
         * 年龄
         */
        private Integer age;

        /**
         * 每月养老金
         */
        private BigDecimal monthlyPension;

        /**
         * 年度领取总额
         */
        private BigDecimal yearlyTotal;
    }
}
