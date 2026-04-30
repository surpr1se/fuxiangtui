package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pdf_upload_record")
public class PdfUploadRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String batchNo;
    private String fileName;
    private Long fileSize;
    private Integer parseStatus;
    private Integer successCount;
    private Integer failCount;
    private Integer costTime;
    private String errorMessage;
    private Integer isBatch;
    private String batchTaskNo;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
