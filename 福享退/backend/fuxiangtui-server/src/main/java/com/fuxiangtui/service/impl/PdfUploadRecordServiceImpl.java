package com.fuxiangtui.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fuxiangtui.entity.PdfUploadRecord;
import com.fuxiangtui.mapper.PdfUploadRecordMapper;
import com.fuxiangtui.service.PdfUploadRecordService;
import org.springframework.stereotype.Service;

@Service
public class PdfUploadRecordServiceImpl extends ServiceImpl<PdfUploadRecordMapper, PdfUploadRecord> implements PdfUploadRecordService {}
