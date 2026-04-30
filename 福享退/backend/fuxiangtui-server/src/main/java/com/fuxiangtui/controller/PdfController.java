package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.PaymentDetail;
import com.fuxiangtui.entity.PdfUploadRecord;
import com.fuxiangtui.service.PaymentDetailService;
import com.fuxiangtui.service.PdfUploadRecordService;
import com.fuxiangtui.util.PdfParser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/v1/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfUploadRecordService pdfUploadRecordService;
    private final PaymentDetailService paymentDetailService;
    private final PdfParser pdfParser;

    @PostMapping("/upload-and-parse")
    public Result<?> uploadAndParse(@RequestAttribute("userId") Long userId,
                                     @RequestParam("file") MultipartFile file) {
        if (file.isEmpty() || !file.getOriginalFilename().endsWith(".pdf")) {
            return Result.fail("请上传PDF文件");
        }

        String batchNo = "B" + System.currentTimeMillis();
        long startTime = System.currentTimeMillis();

        PdfUploadRecord record = new PdfUploadRecord();
        record.setUserId(userId);
        record.setBatchNo(batchNo);
        record.setFileName(file.getOriginalFilename());
        record.setFileSize(file.getSize());
        record.setParseStatus(0);
        record.setIsBatch(0);

        try {
            List<PaymentDetail> details = pdfParser.parse(file.getBytes(), userId, batchNo);
            paymentDetailService.saveBatch(details);

            record.setParseStatus(1);
            record.setSuccessCount(details.size());
            record.setFailCount(0);
            record.setCostTime((int)(System.currentTimeMillis() - startTime));
            pdfUploadRecordService.save(record);

            // 构造返回
            Map<String, Object> data = new HashMap<>();
            data.put("batchNo", batchNo);
            data.put("paymentDetails", details);
            data.put("summary", Map.of(
                "totalMonths", details.size(),
                "dateRange", details.isEmpty() ? "" : details.get(0).getYearMonth() + " 至 " + details.get(details.size()-1).getYearMonth()
            ));
            return Result.ok(data);
        } catch (Exception e) {
            record.setParseStatus(2);
            record.setErrorMessage(e.getMessage());
            record.setCostTime((int)(System.currentTimeMillis() - startTime));
            pdfUploadRecordService.save(record);
            return Result.fail("PDF解析失败: " + e.getMessage());
        }
    }

    @GetMapping("/upload-history")
    public Result<?> uploadHistory(@RequestAttribute("userId") Long userId,
                                    @RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        Page<PdfUploadRecord> pageResult = pdfUploadRecordService.page(
            new Page<>(page, size),
            new LambdaQueryWrapper<PdfUploadRecord>().eq(PdfUploadRecord::getUserId, userId).orderByDesc(PdfUploadRecord::getCreateTime)
        );
        return Result.ok(pageResult);
    }
}
