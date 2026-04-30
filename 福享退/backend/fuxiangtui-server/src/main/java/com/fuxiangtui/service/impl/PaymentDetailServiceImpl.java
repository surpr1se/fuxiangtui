package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.PaymentDetail;
import com.fuxiangtui.mapper.PaymentDetailMapper;
import com.fuxiangtui.service.PaymentDetailService;
import org.springframework.stereotype.Service;

@Service
public class PaymentDetailServiceImpl extends ServiceImpl<PaymentDetailMapper, PaymentDetail> implements PaymentDetailService {}
