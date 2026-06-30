-- 微信小程序登录用户表
-- 非破坏性迁移：不存在则创建；存在则补齐字段和索引

CREATE TABLE IF NOT EXISTS pension_user (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  openid VARCHAR(128) NOT NULL COMMENT '微信openid',
  unionid VARCHAR(128) DEFAULT NULL COMMENT '微信unionid',
  nick_name VARCHAR(128) DEFAULT NULL COMMENT '微信昵称',
  avatar_url VARCHAR(512) DEFAULT NULL COMMENT '微信头像',
  last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_pension_user_openid (openid),
  KEY idx_pension_user_unionid (unionid),
  KEY idx_pension_user_last_login_time (last_login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信小程序用户表';
