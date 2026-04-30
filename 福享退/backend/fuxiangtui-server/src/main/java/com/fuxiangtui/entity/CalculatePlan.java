package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("calculate_plan")
public class CalculatePlan {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String planName;
    private String batchNo;
    private Long resultId;
    private String supplementInfoJson;
    private String resultSnapshotJson;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
