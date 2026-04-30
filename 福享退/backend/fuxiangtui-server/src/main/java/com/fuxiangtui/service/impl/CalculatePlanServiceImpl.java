package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.CalculatePlan;
import com.fuxiangtui.mapper.CalculatePlanMapper;
import com.fuxiangtui.service.CalculatePlanService;
import org.springframework.stereotype.Service;

@Service
public class CalculatePlanServiceImpl extends ServiceImpl<CalculatePlanMapper, CalculatePlan> implements CalculatePlanService {}
