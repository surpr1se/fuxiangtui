package com.fuxiangtui.pension.dto.response;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 养老金计算响应DTO
 */
@Data
public class PensionCalculateResponse {

    /**
     * 出生日期
     */
    private String birthDate;

    /**
     * 退休日期
     */
    private String retireDate;

    /**
     * 退休年龄（岁）
     */
    private BigDecimal retireAge;

    /**
     * 缴费年限
     */
    private BigDecimal paymentYears;

    /**
     * 基础养老金（元/月）
     */
    private BigDecimal basicPension;

    /**
     * 个人账户养老金（元/月）
     */
    private BigDecimal personalAccountPension;

    /**
     * 每月基本养老金总额（元/月）
     */
    private BigDecimal monthlyPension;

    /**
     * 个人账户累计金额
     */
    private BigDecimal personalAccountAmount;

    /**
     * 计发月数
     */
    private Integer paymentMonths;

    /**
     * 备注
     */
    private String remark;
}
