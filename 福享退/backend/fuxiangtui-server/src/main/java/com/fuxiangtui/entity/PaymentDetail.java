package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("payment_detail")
public class PaymentDetail {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String batchNo;
    private String personalNo;
    private String yearMonth;
    private BigDecimal paymentBase;
    private Integer paymentMonths;
    private String unitName;
    private String paymentType;
    private Integer isAbnormal;
    private Integer isEdited;
    private String sourceType;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
