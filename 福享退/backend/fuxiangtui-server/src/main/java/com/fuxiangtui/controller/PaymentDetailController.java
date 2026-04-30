package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.PaymentDetail;
import com.fuxiangtui.service.PaymentDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/payment/detail")
@RequiredArgsConstructor
public class PaymentDetailController {

    private final PaymentDetailService paymentDetailService;

    @GetMapping("/list")
    public Result<?> list(@RequestParam String batchNo,
                          @RequestParam(required = false) String year,
                          @RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "20") int size) {
        LambdaQueryWrapper<PaymentDetail> wrapper = new LambdaQueryWrapper<PaymentDetail>()
            .eq(PaymentDetail::getBatchNo, batchNo)
            .orderByAsc(PaymentDetail::getSortOrder);
        if (year != null && !year.isEmpty()) {
            wrapper.likeRight(PaymentDetail::getYearMonth, year);
        }
        Page<PaymentDetail> pageResult = paymentDetailService.page(new Page<>(page, size), wrapper);
        return Result.ok(pageResult);
    }

    @GetMapping("/{id}")
    public Result<?> get(@PathVariable Long id) {
        return Result.ok(paymentDetailService.getById(id));
    }

    @PostMapping
    public Result<?> add(@RequestBody PaymentDetail detail) {
        detail.setSourceType("MANUAL");
        detail.setIsEdited(1);
        paymentDetailService.save(detail);
        return Result.ok(Map.of("id", detail.getId()));
    }

    @PutMapping("/{id}")
    public Result<?> update(@PathVariable Long id, @RequestBody PaymentDetail detail) {
        detail.setId(id);
        detail.setIsEdited(1);
        paymentDetailService.updateById(detail);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        paymentDetailService.removeById(id);
        return Result.ok();
    }

    @PostMapping("/validate")
    public Result<?> validate(@RequestParam String batchNo) {
        List<PaymentDetail> list = paymentDetailService.list(
            new LambdaQueryWrapper<PaymentDetail>().eq(PaymentDetail::getBatchNo, batchNo).orderByAsc(PaymentDetail::getYearMonth)
        );
        List<Map<String, String>> warnings = new ArrayList<>();
        // 检测断档
        for (int i = 1; i < list.size(); i++) {
            String prev = list.get(i-1).getYearMonth();
            String curr = list.get(i).getYearMonth();
            // 简单判断：如果相差超过2个月，标记断档
            if (prev != null && curr != null) {
                String[] p = prev.split("-");
                String[] c = curr.split("-");
                if (p.length == 2 && c.length == 2) {
                    int prevVal = Integer.parseInt(p[0]) * 12 + Integer.parseInt(p[1]);
                    int currVal = Integer.parseInt(c[0]) * 12 + Integer.parseInt(c[1]);
                    if (currVal - prevVal > 2) {
                        warnings.add(Map.of("type", "GAP", "message", prev + " 至 " + curr + " 存在缴费断档"));
                    }
                }
            }
        }
        return Result.ok(Map.of("warnings", warnings));
    }
}
