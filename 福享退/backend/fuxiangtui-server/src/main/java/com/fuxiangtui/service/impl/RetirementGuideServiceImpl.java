package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.RetirementGuide;
import com.fuxiangtui.mapper.RetirementGuideMapper;
import com.fuxiangtui.service.RetirementGuideService;
import org.springframework.stereotype.Service;

@Service
public class RetirementGuideServiceImpl extends ServiceImpl<RetirementGuideMapper, RetirementGuide> implements RetirementGuideService {}
