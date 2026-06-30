package com.fuxiangtui.pension.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * 待遇调整预测请求DTO
 */
@Data
public class PensionAdjustmentRequest {

    /**
     * 出生日期
     */
    @NotBlank(message = "出生日期不能为空")
    private String birthDate;

    /**
     * 退休日期
     */
    @NotBlank(message = "退休日期不能为空")
    private String retireDate;

    /**
     * 首月养老金（元）
     */
    @NotNull(message = "首月养老金不能为空")
    private BigDecimal initialMonthlyPension;

    /**
     * 年增长率（默认4.5%）
     */
    private BigDecimal annualGrowthRate = new BigDecimal("0.045");
}
