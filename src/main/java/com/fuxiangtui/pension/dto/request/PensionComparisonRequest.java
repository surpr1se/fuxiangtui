package com.fuxiangtui.pension.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * 多方案对比请求DTO
 */
@Data
public class PensionComparisonRequest {

    /**
     * 出生日期
     */
    @NotBlank(message = "出生日期不能为空")
    private String birthDate;

    /**
     * 人员类型
     */
    @NotNull(message = "人员类型不能为空")
    private Integer personType;

    /**
     * 退休日期
     */
    private String retireDate;

    /**
     * 当前缴费基数
     */
    private BigDecimal currentPaymentBase;

    /**
     * 当前社平工资
     */
    private BigDecimal socialAverageWage;

    /**
     * 已有个人账户金额
     */
    private BigDecimal personalAccountAmount;

    /**
     * 已缴费年限
     */
    private BigDecimal paidYears;

    /**
     * 剩余缴费年限
     */
    private BigDecimal remainingYears;
}
