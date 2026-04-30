package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("delayed_retirement_record")
public class DelayedRetirementRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long resultId;
    private String delayType;
    private Integer delayMonths;
    private String originalResultJson;
    private String delayedResultJson;
    private String comparisonJson;
    private BigDecimal crossoverAge;
    private String suggestion;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
