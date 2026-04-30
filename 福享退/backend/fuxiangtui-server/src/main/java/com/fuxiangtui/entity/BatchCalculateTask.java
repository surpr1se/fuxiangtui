package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("batch_calculate_task")
public class BatchCalculateTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String taskBatchNo;
    private String fileBatchNo;
    private Integer totalCount;
    private Integer successCount;
    private Integer failCount;
    private Integer status;
    private String supplementInfoJson;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private LocalDateTime finishTime;
    @TableLogic
    private Integer isDeleted;
}
