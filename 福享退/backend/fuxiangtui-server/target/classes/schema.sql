-- 福享退数据库初始化脚本
-- 数据库：fuxiangtui
-- 版本：V1.0
-- 日期：2026-04-30

CREATE DATABASE IF NOT EXISTS fuxiangtui DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE fuxiangtui;

-- 1. 用户表
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
  UNIQUE KEY `uk_open_id` (`open_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 缴费明细表
CREATE TABLE IF NOT EXISTS `payment_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `batch_no` varchar(32) NOT NULL COMMENT '批次号',
  `personal_no` varchar(32) DEFAULT NULL COMMENT '个人编号',
  `year_month` varchar(7) NOT NULL COMMENT '费款所属期YYYY-MM',
  `payment_base` decimal(10,2) NOT NULL COMMENT '缴费基数',
  `payment_months` int NOT NULL DEFAULT 1 COMMENT '缴费月数',
  `unit_name` varchar(256) DEFAULT NULL COMMENT '单位名称',
  `payment_type` varchar(32) DEFAULT '正常应缴' COMMENT '缴费性质',
  `is_abnormal` tinyint NOT NULL DEFAULT 0 COMMENT '是否异常',
  `is_edited` tinyint NOT NULL DEFAULT 0 COMMENT '是否人工编辑',
  `source_type` varchar(16) NOT NULL DEFAULT 'PDF' COMMENT '数据来源',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序字段',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_batch` (`user_id`, `batch_no`),
  KEY `idx_year_month` (`year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='缴费明细表';

-- 3. 待遇计算结果表
CREATE TABLE IF NOT EXISTS `pension_calculate_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `batch_no` varchar(32) NOT NULL COMMENT '缴费明细批次号',
  `calculate_no` varchar(32) NOT NULL COMMENT '计算流水号',
  `name` varchar(32) DEFAULT NULL COMMENT '姓名（脱敏）',
  `id_card` varchar(18) DEFAULT NULL COMMENT '身份证号（脱敏）',
  `gender` varchar(4) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `personal_info_json` text DEFAULT NULL COMMENT '个人信息快照JSON',
  `retirement_identity` varchar(16) NOT NULL COMMENT '退休身份',
  `retirement_age` int NOT NULL COMMENT '退休年龄',
  `retirement_year` int NOT NULL COMMENT '退休年份',
  `actual_payment_years` decimal(4,1) NOT NULL COMMENT '实际缴费年限',
  `visual_payment_years` decimal(4,1) NOT NULL DEFAULT 0.0 COMMENT '视同缴费年限',
  `total_payment_years` decimal(4,1) NOT NULL COMMENT '累计缴费年限',
  `average_payment_index` decimal(8,4) NOT NULL COMMENT '平均缴费指数',
  `personal_account_amount` decimal(12,2) DEFAULT NULL COMMENT '个人账户储存额',
  `calculation_params_json` text DEFAULT NULL COMMENT '计算参数快照JSON',
  `basic_pension` decimal(10,2) NOT NULL COMMENT '基础养老金',
  `personal_account_pension` decimal(10,2) NOT NULL COMMENT '个人账户养老金',
  `transitional_pension` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '过渡性养老金',
  `payment_years_pension` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '缴费年限养老金',
  `total_monthly_pension` decimal(10,2) NOT NULL COMMENT '月养老金合计',
  `pension_type` varchar(16) NOT NULL DEFAULT 'ENTERPRISE' COMMENT '养老保险类型',
  `payback_age` decimal(4,1) DEFAULT NULL COMMENT '回本年龄',
  `total_personal_payment` decimal(12,2) DEFAULT NULL COMMENT '个人累计缴费总额',
  `delayed_pension` decimal(10,2) DEFAULT NULL COMMENT '延迟退休后月养老金',
  `delayed_retirement_age` int DEFAULT NULL COMMENT '延迟退休年龄',
  `calculation_process` text DEFAULT NULL COMMENT '计算过程JSON',
  `warnings` text DEFAULT NULL COMMENT '预警信息',
  `calculate_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `calculate_version` varchar(16) NOT NULL DEFAULT 'V1.0',
  `social_avg_wage_year` int NOT NULL COMMENT '社平工资年度',
  `is_shared` tinyint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_calculate_no` (`calculate_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_calculate_time` (`calculate_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待遇计算结果表';

-- 4. 系统参数表
CREATE TABLE IF NOT EXISTS `sys_parameter` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `param_type` varchar(32) NOT NULL COMMENT '参数类型',
  `param_key` varchar(64) NOT NULL COMMENT '参数键',
  `param_value` varchar(256) NOT NULL COMMENT '参数值',
  `param_desc` varchar(128) DEFAULT NULL,
  `effective_year` int DEFAULT NULL COMMENT '生效年度',
  `effective_date` date DEFAULT NULL,
  `expire_date` date DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_type_year` (`param_type`, `effective_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统参数表';

-- 5. 计发月数表
CREATE TABLE IF NOT EXISTS `calculation_month` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `retirement_age` int NOT NULL COMMENT '退休年龄',
  `month_count` int NOT NULL COMMENT '计发月数',
  `description` varchar(64) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_retirement_age` (`retirement_age`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计发月数表';

-- 6. PDF上传记录表
CREATE TABLE IF NOT EXISTS `pdf_upload_record` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `batch_no` varchar(32) NOT NULL COMMENT '批次号',
  `file_name` varchar(256) NOT NULL,
  `file_size` bigint NOT NULL COMMENT '文件大小(字节)',
  `parse_status` tinyint NOT NULL DEFAULT 0 COMMENT '0处理中 1成功 2失败',
  `success_count` int NOT NULL DEFAULT 0,
  `fail_count` int NOT NULL DEFAULT 0,
  `cost_time` int NOT NULL DEFAULT 0 COMMENT '耗时(毫秒)',
  `error_message` text DEFAULT NULL,
  `is_batch` tinyint NOT NULL DEFAULT 0 COMMENT '是否批量',
  `batch_task_no` varchar(32) DEFAULT NULL COMMENT '批量任务编号',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `create_time` DESC),
  KEY `idx_batch_no` (`batch_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PDF上传记录表';

-- 7. 测算方案表
CREATE TABLE IF NOT EXISTS `calculate_plan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `plan_name` varchar(64) NOT NULL COMMENT '方案名称',
  `batch_no` varchar(32) NOT NULL,
  `result_id` bigint NOT NULL COMMENT '关联计算结果ID',
  `supplement_info_json` text DEFAULT NULL,
  `result_snapshot_json` text DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_result_id` (`result_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测算方案表';

-- 8. 批量测算任务表
CREATE TABLE IF NOT EXISTS `batch_calculate_task` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `task_batch_no` varchar(32) NOT NULL COMMENT '批量任务编号',
  `file_batch_no` varchar(32) NOT NULL COMMENT 'PDF上传批次号',
  `total_count` int NOT NULL DEFAULT 0,
  `success_count` int NOT NULL DEFAULT 0,
  `fail_count` int NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0待处理 1处理中 2已完成 3部分失败',
  `supplement_info_json` text DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `finish_time` datetime DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_batch_no` (`task_batch_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批量测算任务表';

-- 9. 批量测算明细表
CREATE TABLE IF NOT EXISTS `batch_calculate_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_batch_no` varchar(32) NOT NULL,
  `user_id` bigint NOT NULL,
  `personal_batch_no` varchar(32) DEFAULT NULL,
  `file_name` varchar(256) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `id_card_masked` varchar(18) DEFAULT NULL,
  `parse_status` tinyint NOT NULL DEFAULT 0 COMMENT '0待处理 1成功 2失败',
  `calculate_status` tinyint NOT NULL DEFAULT 0 COMMENT '0待计算 1成功 2失败',
  `result_id` bigint DEFAULT NULL,
  `monthly_pension` decimal(10,2) DEFAULT NULL,
  `error_message` varchar(512) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_batch_no` (`task_batch_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批量测算明细表';

-- 10. 待遇调整预测记录表
CREATE TABLE IF NOT EXISTS `pension_adjustment_predict` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `result_id` bigint NOT NULL,
  `predict_life_age` int NOT NULL DEFAULT 85,
  `annual_increase_rate` decimal(4,4) NOT NULL DEFAULT 0.0400,
  `predict_data_json` text NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_result_id` (`result_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待遇调整预测记录表';

-- 11. 延迟退休测算记录表
CREATE TABLE IF NOT EXISTS `delayed_retirement_record` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `result_id` bigint NOT NULL,
  `delay_type` varchar(16) NOT NULL COMMENT 'GRADUAL/YEAR_1/YEAR_2/YEAR_3/CUSTOM',
  `delay_months` int NOT NULL DEFAULT 0,
  `original_result_json` text DEFAULT NULL,
  `delayed_result_json` text DEFAULT NULL,
  `comparison_json` text DEFAULT NULL,
  `crossover_age` decimal(4,1) DEFAULT NULL COMMENT '交叉点年龄',
  `suggestion` text DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_result_id` (`result_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='延迟退休测算记录表';

-- 12. 退休办理指南表
CREATE TABLE IF NOT EXISTS `retirement_guide` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(32) NOT NULL COMMENT 'PROCESS/MATERIAL/OFFICE/FAQ',
  `person_type` varchar(32) DEFAULT NULL COMMENT 'ENTERPRISE/GOVERNMENT/FLEXIBLE/SPECIAL',
  `city` varchar(32) DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `content` text NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`, `person_type`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退休办理指南表';

-- 13. 操作日志表
CREATE TABLE IF NOT EXISTS `sys_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `operation_type` varchar(32) NOT NULL COMMENT 'LOGIN/UPLOAD_PDF/CALCULATE/SHARE',
  `operation_desc` varchar(256) DEFAULT NULL,
  `request_ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `cost_time` int NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `create_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ========== 初始数据 ==========

-- 计发月数
INSERT IGNORE INTO `calculation_month` (`retirement_age`, `month_count`, `description`) VALUES
(40, 233, '40岁退休'), (45, 216, '45岁退休'), (50, 195, '女工人50岁退休'),
(55, 170, '女干部55岁退休'), (60, 139, '男性60岁退休'), (65, 101, '65岁退休'),
(70, 56, '70岁退休');

-- 社平工资参数
INSERT IGNORE INTO `sys_parameter` (`param_type`, `param_key`, `param_value`, `effective_year`, `param_desc`) VALUES
('SOCIAL_AVG_WAGE', '2022', '6859.00', 2022, '2022年度福建省在岗职工月平均工资'),
('SOCIAL_AVG_WAGE', '2023', '7197.00', 2023, '2023年度福建省在岗职工月平均工资'),
('SOCIAL_AVG_WAGE', '2024', '7525.00', 2024, '2024年度福建省在岗职工月平均工资'),
('SOCIAL_AVG_WAGE', '2025', '7875.00', 2025, '2025年度福建省在岗职工月平均工资');

-- 记账利率
INSERT IGNORE INTO `sys_parameter` (`param_type`, `param_key`, `param_value`, `effective_year`, `param_desc`) VALUES
('ACCOUNT_INTEREST', '2022', '3.85', 2022, '2022年度个人账户记账利率(%)'),
('ACCOUNT_INTEREST', '2023', '3.05', 2023, '2023年度个人账户记账利率(%)'),
('ACCOUNT_INTEREST', '2024', '2.85', 2024, '2024年度个人账户记账利率(%)'),
('ACCOUNT_INTEREST', '2025', '2.85', 2025, '2025年度个人账户记账利率(%)');

-- 退休办理指南-流程
INSERT IGNORE INTO `retirement_guide` (`category`, `title`, `content`, `sort_order`) VALUES
('PROCESS', '1. 确认退休条件', '累计缴费满15年，达到法定退休年龄', 1),
('PROCESS', '2. 准备申请材料', '身份证、社保卡、个人档案、缴费明细等', 2),
('PROCESS', '3. 提交退休申请', '到参保地社保经办机构窗口提交，或通过福建省社保网上办事大厅在线申请', 3),
('PROCESS', '4. 待遇核定', '社保机构审核材料，核定养老金待遇标准', 4),
('PROCESS', '5. 领取养老金', '核定通过后，次月起按月发放养老金至社保卡金融账户', 5);

-- 退休办理指南-FAQ
INSERT IGNORE INTO `retirement_guide` (`category`, `title`, `content`, `sort_order`) VALUES
('FAQ', '如何获取缴费明细PDF？', '登录福建省社保网上办事大厅（http://220.160.52.229:8801/fjylbx/），在"个人权益记录"中下载打印', 1),
('FAQ', '缴费基数异常怎么办？', '可以手动编辑修改，但建议以社保机构记录为准', 2),
('FAQ', '计算结果准确吗？', '本小程序计算结果仅供参考，非正式待遇核定依据，实际以社保经办机构核定为准', 3),
('FAQ', '退休年龄如何确定？', '男性60周岁，女工人50周岁，女干部55周岁。特殊工种可提前退休', 4);

-- 办事地点
INSERT IGNORE INTO `retirement_guide` (`category`, `city`, `title`, `content`, `sort_order`) VALUES
('OFFICE', '福州', '福州市社会保险中心', '福州市鼓楼区五四北路396号，电话：0591-87305920', 1),
('OFFICE', '厦门', '厦门市社会保险中心', '厦门市湖里区云顶北路842号，电话：0592-5369037', 2),
('OFFICE', '泉州', '泉州市社会保险中心', '泉州市丰泽区坪山路255号，电话：0595-22272135', 3);
