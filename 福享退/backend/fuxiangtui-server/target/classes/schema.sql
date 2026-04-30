-- 福享退数据库初始化脚本 - 基础框架
-- 数据库：fuxiangtui
-- 版本：V1.0 基础框架
-- 日期：2026-04-30

CREATE DATABASE IF NOT EXISTS fuxiangtui DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE fuxiangtui;

-- 1. 用户表（基础框架必备）
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `open_id` varchar(128) NOT NULL COMMENT '微信用户唯一标识',
  `union_id` varchar(128) DEFAULT NULL COMMENT '微信开放平台统一ID',
  `nick_name` varchar(64) DEFAULT NULL COMMENT '用户昵称',
  `avatar_url` varchar(256) DEFAULT NULL COMMENT '头像URL',
  `gender` tinyint DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `city` varchar(32) DEFAULT NULL,
  `province` varchar(32) DEFAULT NULL,
  `country` varchar(32) DEFAULT NULL,
  `language` varchar(16) DEFAULT 'zh_CN',
  `is_guest` tinyint NOT NULL DEFAULT 0 COMMENT '是否游客：0否 1是',
  `last_login_time` datetime DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_open_id` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
