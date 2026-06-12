package com.fuxiangtui.controller;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.fuxiangtui.common.Result;
import com.fuxiangtui.entity.SysUser;
import com.fuxiangtui.service.SysUserService;
import com.fuxiangtui.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${wechat.mini-program.appid:}")
    private String wechatAppId;

    @Value("${wechat.mini-program.app-secret:}")
    private String wechatAppSecret;

    @PostMapping({"/wx-login", "/wxlogin"})
    public Result<?> wxLogin(@RequestBody Map<String, String> params) {
        String code = params.getOrDefault("code", "");
        String nickName = params.getOrDefault("nickName", "微信用户");
        String avatarUrl = params.getOrDefault("avatarUrl", "");

        WxSession wxSession = resolveWxSession(code);
        if (wxSession.errorMessage != null) return Result.fail(401, wxSession.errorMessage);

        SysUser user = sysUserService.lambdaQuery().eq(SysUser::getOpenId, wxSession.openId).one();
        if (user == null) {
            user = new SysUser();
            user.setOpenId(wxSession.openId);
            user.setUnionId(wxSession.unionId);
            user.setNickName(nickName);
            user.setAvatarUrl(avatarUrl);
            user.setIsGuest(0);
            user.setLastLoginTime(LocalDateTime.now());
            sysUserService.save(user);
        } else {
            if (wxSession.unionId != null && !wxSession.unionId.isEmpty()) user.setUnionId(wxSession.unionId);
            if (nickName != null && !nickName.isEmpty() && !"微信用户".equals(nickName)) user.setNickName(nickName);
            if (avatarUrl != null && !avatarUrl.isEmpty()) user.setAvatarUrl(avatarUrl);
            user.setLastLoginTime(LocalDateTime.now());
            sysUserService.updateById(user);
        }

        String token = jwtUtil.generateToken(user.getId(), wxSession.openId);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("openId", wxSession.openId);
        data.put("unionId", user.getUnionId());
        data.put("nickName", user.getNickName());
        data.put("avatarUrl", user.getAvatarUrl());
        data.put("userInfo", user);
        return Result.ok(data);
    }

    @GetMapping({"/profile", "/info"})
    public Result<?> getProfile(@RequestAttribute("userId") Long userId) {
        SysUser user = sysUserService.getById(userId);
        if (user == null) return Result.fail("用户不存在");
        return Result.ok(user);
    }

    @PutMapping({"/profile", "/info"})
    public Result<?> updateProfile(@RequestAttribute("userId") Long userId, @RequestBody SysUser updateUser) {
        updateUser.setId(userId);
        updateUser.setOpenId(null);
        updateUser.setUnionId(null);
        updateUser.setIsGuest(null);
        updateUser.setLastLoginTime(null);
        sysUserService.updateById(updateUser);
        return Result.ok(sysUserService.getById(userId));
    }

    private WxSession resolveWxSession(String code) {
        WxSession session = new WxSession();
        if (code == null || code.isBlank()) {
            session.errorMessage = "微信登录 code 不能为空";
            return session;
        }
        if (wechatAppId == null || wechatAppId.isBlank() || wechatAppSecret == null || wechatAppSecret.isBlank()) {
            session.errorMessage = "后端未配置 wechat.mini-program.appid/app-secret";
            return session;
        }
        try {
            Map<String, Object> query = new HashMap<>();
            query.put("appid", wechatAppId);
            query.put("secret", wechatAppSecret);
            query.put("js_code", code);
            query.put("grant_type", "authorization_code");
            String body = HttpUtil.get("https://api.weixin.qq.com/sns/jscode2session", query, 10000);
            JSONObject json = JSONUtil.parseObj(body);
            Integer errCode = json.getInt("errcode");
            if (errCode != null && errCode != 0) {
                session.errorMessage = "微信登录失败：" + json.getStr("errmsg", String.valueOf(errCode));
                return session;
            }
            session.openId = json.getStr("openid");
            session.unionId = json.getStr("unionid");
            if (session.openId == null || session.openId.isBlank()) session.errorMessage = "微信登录失败：未返回 openid";
            return session;
        } catch (Exception e) {
            session.errorMessage = "微信登录异常：" + e.getMessage();
            return session;
        }
    }

    private static class WxSession {
        private String openId;
        private String unionId;
        private String errorMessage;
    }
}
