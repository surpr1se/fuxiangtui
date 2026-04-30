package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.DelayedRetirementRecord;
import com.fuxiangtui.mapper.DelayedRetirementRecordMapper;
import com.fuxiangtui.service.DelayedRetirementRecordService;
import org.springframework.stereotype.Service;

@Service
public class DelayedRetirementRecordServiceImpl extends ServiceImpl<DelayedRetirementRecordMapper, DelayedRetirementRecord> implements DelayedRetirementRecordService {}
