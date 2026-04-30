package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.PensionCalculateResult;
import com.fuxiangtui.mapper.PensionCalculateResultMapper;
import com.fuxiangtui.service.PensionCalculateResultService;
import org.springframework.stereotype.Service;

@Service
public class PensionCalculateResultServiceImpl extends ServiceImpl<PensionCalculateResultMapper, PensionCalculateResult> implements PensionCalculateResultService {}
