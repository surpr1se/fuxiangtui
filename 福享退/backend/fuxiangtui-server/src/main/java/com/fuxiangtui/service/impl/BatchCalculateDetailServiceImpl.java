package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.BatchCalculateDetail;
import com.fuxiangtui.mapper.BatchCalculateDetailMapper;
import com.fuxiangtui.service.BatchCalculateDetailService;
import org.springframework.stereotype.Service;

@Service
public class BatchCalculateDetailServiceImpl extends ServiceImpl<BatchCalculateDetailMapper, BatchCalculateDetail> implements BatchCalculateDetailService {}
