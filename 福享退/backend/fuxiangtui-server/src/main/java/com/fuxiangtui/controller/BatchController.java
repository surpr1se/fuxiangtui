package com.fuxiangtui.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.BatchCalculateTask;
import com.fuxiangtui.entity.BatchCalculateDetail;
import com.fuxiangtui.service.BatchCalculateTaskService;
import com.fuxiangtui.service.BatchCalculateDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/batch")
@RequiredArgsConstructor
public class BatchController {

    private final BatchCalculateTaskService batchCalculateTaskService;
    private final BatchCalculateDetailService batchCalculateDetailService;

    @PostMapping("/create")
    public Result<?> createBatch(@RequestAttribute("userId") Long userId, @RequestBody Map<String, Object> params) {
        String fileBatchNo = (String) params.get("fileBatchNo");
        BatchCalculateTask task = new BatchCalculateTask();
        task.setUserId(userId);
        task.setTaskBatchNo("BT" + System.currentTimeMillis());
        task.setFileBatchNo(fileBatchNo);
        task.setTotalCount(0);
        task.setSuccessCount(0);
        task.setFailCount(0);
        task.setStatus(0);
        task.setSupplementInfoJson(params.containsKey("supplementInfo") ? params.get("supplementInfo").toString() : null);
        batchCalculateTaskService.save(task);
        return Result.ok(Map.of("taskBatchNo", task.getTaskBatchNo()));
    }

    @GetMapping("/status/{taskBatchNo}")
    public Result<?> batchStatus(@PathVariable String taskBatchNo) {
        BatchCalculateTask task = batchCalculateTaskService.getOne(
            new LambdaQueryWrapper<BatchCalculateTask>().eq(BatchCalculateTask::getTaskBatchNo, taskBatchNo)
        );
        if (task == null) return Result.fail("任务不存在");
        return Result.ok(Map.of(
            "status", task.getStatus(),
            "totalCount", task.getTotalCount(),
            "completedCount", task.getSuccessCount() + task.getFailCount(),
            "successCount", task.getSuccessCount(),
            "failCount", task.getFailCount()
        ));
    }

    @GetMapping("/result/{taskBatchNo}")
    public Result<?> batchResult(@PathVariable String taskBatchNo,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return Result.ok(batchCalculateDetailService.page(
            new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size),
            new LambdaQueryWrapper<BatchCalculateDetail>().eq(BatchCalculateDetail::getTaskBatchNo, taskBatchNo)
        ));
    }

    @GetMapping("/result/{taskBatchNo}/summary")
    public Result<?> batchSummary(@PathVariable String taskBatchNo) {
        List<BatchCalculateDetail> details = batchCalculateDetailService.list(
            new LambdaQueryWrapper<BatchCalculateDetail>()
                .eq(BatchCalculateDetail::getTaskBatchNo, taskBatchNo)
                .eq(BatchCalculateDetail::getCalculateStatus, 1)
        );
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCount", details.size());
        if (!details.isEmpty()) {
            double avg = details.stream().mapToDouble(d -> d.getMonthlyPension() != null ? d.getMonthlyPension().doubleValue() : 0).average().orElse(0);
            double max = details.stream().mapToDouble(d -> d.getMonthlyPension() != null ? d.getMonthlyPension().doubleValue() : 0).max().orElse(0);
            double min = details.stream().mapToDouble(d -> d.getMonthlyPension() != null ? d.getMonthlyPension().doubleValue() : 0).min().orElse(0);
            summary.put("avgPension", avg);
            summary.put("maxPension", max);
            summary.put("minPension", min);
        }
        return Result.ok(summary);
    }
}
