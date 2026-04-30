package com.fuxiangtui.util;

import com.fuxiangtui.entity.PaymentDetail;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.regex.*;

@Component
public class PdfParser {

    public List<PaymentDetail> parse(byte[] pdfBytes, Long userId, String batchNo) throws IOException {
        // 使用PDFBox 3.x解析PDF文本
        try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            StringBuilder fullText = new StringBuilder();
            for (int i = 1; i <= document.getNumberOfPages(); i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                fullText.append(stripper.getText(document)).append("\n");
            }

        String text = fullText.toString();
        List<PaymentDetail> details = new ArrayList<>();

        // 解析缴费明细行：匹配 "年月 缴费基数 缴费月数" 的模式
        // 格式示例：202603  4043  1
        Pattern linePattern = Pattern.compile("(\\d{4})(\\d{2})\\s+(\\d+\\.?\\d*)\\s+(\\d+)\\s+");
        Matcher matcher = linePattern.matcher(text);

        int sortOrder = 0;
        while (matcher.find()) {
            String year = matcher.group(1);
            String month = matcher.group(2);
            String base = matcher.group(3);
            String months = matcher.group(4);

            PaymentDetail detail = new PaymentDetail();
            detail.setUserId(userId);
            detail.setBatchNo(batchNo);
            detail.setYearMonth(year + "-" + month);
            detail.setPaymentBase(new BigDecimal(base));
            detail.setPaymentMonths(Integer.parseInt(months));
            detail.setPaymentType("正常应缴");
            detail.setSourceType("PDF");
            detail.setIsAbnormal(0);
            detail.setIsEdited(0);
            detail.setSortOrder(sortOrder++);
            details.add(detail);
        }

        // 按年月排序
        details.sort(Comparator.comparing(PaymentDetail::getYearMonth));
        for (int i = 0; i < details.size(); i++) {
            details.get(i).setSortOrder(i);
        }

        return details;
        } // end try
    }
}
