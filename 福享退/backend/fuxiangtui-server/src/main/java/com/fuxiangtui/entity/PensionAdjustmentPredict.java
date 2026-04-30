package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("pension_adjustment_predict")
public class PensionAdjustmentPredict {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long resultId;
    private Integer predictLifeAge;
    private BigDecimal annualIncreaseRate;
    private String predictDataJson;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
