package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.BatchCalculateTask;
import com.fuxiangtui.mapper.BatchCalculateTaskMapper;
import com.fuxiangtui.service.BatchCalculateTaskService;
import org.springframework.stereotype.Service;

@Service
public class BatchCalculateTaskServiceImpl extends ServiceImpl<BatchCalculateTaskMapper, BatchCalculateTask> implements BatchCalculateTaskService {}
