package com.fuxiangtui.config;

import com.fuxiangtui.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // 放行路径
        if (path.startsWith("/api/v1/user/wx-login") ||
            path.startsWith("/api/v1/system") ||
            path.startsWith("/api/v1/guide") ||
            path.contains("swagger") || path.contains("actuator")) {
            chain.doFilter(request, response);
            return;
        }

        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (token == null || jwtUtil.isExpired(token)) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(Map.of("code", 401, "message", "未登录或token已过期")));
            return;
        }

        try {
            Long userId = jwtUtil.getUserId(token);
            request.setAttribute("userId", userId);
            chain.doFilter(request, response);
        } catch (Exception e) {
            System.out.println("JWT parse error: " + e.getClass().getName() + ": " + e.getMessage());
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(Map.of("code", 401, "message", "token无效")));
        }
    }
}
