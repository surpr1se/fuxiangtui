package com.fuxiangtui.controller;

import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.SysUser;
import com.fuxiangtui.service.SysUserService;
import com.fuxiangtui.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final SysUserService sysUserService;
    private final JwtUtil jwtUtil;

    @PostMapping("/wx-login")
    public Result<?> wxLogin(@RequestBody Map<String, String> params) {
        String code = params.get("code");
        String nickName = params.getOrDefault("nickName", "微信用户");
        String avatarUrl = params.getOrDefault("avatarUrl", "");

        // 模拟微信登录 - 实际应调用微信API获取openId
        String openId = "wx_" + System.currentTimeMillis();

        SysUser user = sysUserService.lambdaQuery().eq(SysUser::getOpenId, openId).one();
        if (user == null) {
            user = new SysUser();
            user.setOpenId(openId);
            user.setNickName(nickName);
            user.setAvatarUrl(avatarUrl);
            user.setIsGuest(0);
            user.setLastLoginTime(LocalDateTime.now());
            sysUserService.save(user);
        } else {
            user.setLastLoginTime(LocalDateTime.now());
            sysUserService.updateById(user);
        }

        String token = jwtUtil.generateToken(user.getId(), openId);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("openId", openId);
        return Result.ok(data);
    }

    @GetMapping("/profile")
    public Result<?> getProfile(@RequestAttribute("userId") Long userId) {
        SysUser user = sysUserService.getById(userId);
        if (user == null) return Result.fail("用户不存在");
        return Result.ok(user);
    }

    @PutMapping("/profile")
    public Result<?> updateProfile(@RequestAttribute("userId") Long userId, @RequestBody SysUser updateUser) {
        updateUser.setId(userId);
        sysUserService.updateById(updateUser);
        return Result.ok();
    }

    @GetMapping("/stats")
    public Result<?> getUserStats(@RequestAttribute("userId") Long userId) {
        // TODO: 聚合计算次数、平均待遇、累计缴费月
        Map<String, Object> stats = new HashMap<>();
        stats.put("calculateCount", 0);
        stats.put("avgPension", 0);
        stats.put("totalPaymentMonths", 0);
        return Result.ok(stats);
    }
}
