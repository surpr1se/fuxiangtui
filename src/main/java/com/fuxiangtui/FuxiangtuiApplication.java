package com.fuxiangtui;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 福享退 - 养老金计算服务启动类
 */
@SpringBootApplication
public class FuxiangtuiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FuxiangtuiApplication.class, args);
        System.out.println("======================================");
        System.out.println("  福享退 - 养老金计算服务启动成功！");
        System.out.println("  Swagger文档: http://localhost:8080/doc.html");
        System.out.println("======================================");
    }
}
