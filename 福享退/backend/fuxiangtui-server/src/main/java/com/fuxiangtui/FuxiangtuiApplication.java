package com.fuxiangtui;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.fuxiangtui.mapper")
public class FuxiangtuiApplication {
    public static void main(String[] args) {
        SpringApplication.run(FuxiangtuiApplication.class, args);
    }
}
