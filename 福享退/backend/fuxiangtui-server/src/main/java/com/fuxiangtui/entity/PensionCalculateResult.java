package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("pension_calculate_result")
public class PensionCalculateResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String batchNo;
    private String calculateNo;
    // 人员基础信息
    private String name;
    private String idCard;
    private String gender;
    private LocalDate birthDate;
    private String personalInfoJson;
    // 计算参数
    private String retirementIdentity;
    private Integer retirementAge;
    private Integer retirementYear;
    private BigDecimal actualPaymentYears;
    private BigDecimal visualPaymentYears;
    private BigDecimal totalPaymentYears;
    private BigDecimal averagePaymentIndex;
    private BigDecimal personalAccountAmount;
    private String calculationParamsJson;
    // 计算结果
    private BigDecimal basicPension;
    private BigDecimal personalAccountPension;
    private BigDecimal transitionalPension;
    private BigDecimal paymentYearsPension;
    private BigDecimal totalMonthlyPension;
    // V2.0新增
    private String pensionType;
    private BigDecimal paybackAge;
    private BigDecimal totalPersonalPayment;
    private BigDecimal delayedPension;
    private Integer delayedRetirementAge;
    // 计算过程
    private String calculationProcess;
    private String warnings;
    // 元信息
    private LocalDateTime calculateTime;
    private String calculateVersion;
    private Integer socialAvgWageYear;
    private Integer isShared;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
