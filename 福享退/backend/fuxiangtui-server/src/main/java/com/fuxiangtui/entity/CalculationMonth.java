package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("calculation_month")
public class CalculationMonth {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer retirementAge;
    private Integer monthCount;
    private String description;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer isDeleted;
}
