package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.CalculationMonth;
import com.fuxiangtui.mapper.CalculationMonthMapper;
import com.fuxiangtui.service.CalculationMonthService;
import org.springframework.stereotype.Service;

@Service
public class CalculationMonthServiceImpl extends ServiceImpl<CalculationMonthMapper, CalculationMonth> implements CalculationMonthService {}
