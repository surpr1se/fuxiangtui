package com.fuxiangtui.pension.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * 养老金计算请求DTO
 */
@Data
public class PensionCalculateRequest {

    /**
     * 出生日期
     */
    @NotBlank(message = "出生日期不能为空")
    private String birthDate;

    /**
     * 人员类型：11=女工人，12=女干部，13=女性灵活就业，21=男性
     */
    @NotNull(message = "人员类型不能为空")
    private Integer personType;

    /**
     * 首次缴费日期
     */
    private String paymentStartDate;

    /**
     * 累计缴费年限（年）
     */
    private BigDecimal paymentYears;

    /**
     * 个人账户累计金额（元）
     */
    private BigDecimal personalAccountAmount;

    /**
     * 平均缴费指数
     */
    private BigDecimal averagePaymentIndex;

    /**
     * 退休上年社平工资（元）
     */
    private BigDecimal socialAverageWage;
}
