-- 将头像字段从短 URL 扩展为 MEDIUMTEXT，支持保存小程序头像 dataURL/base64
ALTER TABLE `sys_user`
  MODIFY COLUMN `avatar_url` MEDIUMTEXT DEFAULT NULL COMMENT '头像URL或base64头像数据';
