package com.fuxiangtui.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("retirement_guide")
public class RetirementGuide {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String category;
    private String personType;
    private String city;
    private String title;
    private String content;
    private Integer sortOrder;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
