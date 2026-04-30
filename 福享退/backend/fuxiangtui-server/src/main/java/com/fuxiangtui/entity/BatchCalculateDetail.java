package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("batch_calculate_detail")
public class BatchCalculateDetail {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskBatchNo;
    private Long userId;
    private String personalBatchNo;
    private String fileName;
    private String name;
    private String idCardMasked;
    private Integer parseStatus;
    private Integer calculateStatus;
    private Long resultId;
    private BigDecimal monthlyPension;
    private String errorMessage;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
