package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_parameter")
public class SysParameter {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String paramType;
    private String paramKey;
    private String paramValue;
    private String paramDesc;
    private Integer effectiveYear;
    private java.time.LocalDate effectiveDate;
    private java.time.LocalDate expireDate;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
