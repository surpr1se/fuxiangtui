-- 福建省近20年社会平均工资初始化脚本
-- 口径：城镇非私营单位就业人员年平均工资，单位：元/年。
-- 写入方案：专表 sys_social_average_wage，按 province + wage_year + wage_type 幂等 upsert。
-- 回滚：见 20260603_social_average_wage_rollback.sql

CREATE TABLE IF NOT EXISTS sys_social_average_wage (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  province VARCHAR(32) NOT NULL DEFAULT '福建省' COMMENT '省份',
  wage_year INT NOT NULL COMMENT '工资年度',
  annual_wage DECIMAL(12,2) NOT NULL COMMENT '年平均工资，元/年',
  monthly_wage DECIMAL(12,2) NOT NULL COMMENT '月平均工资，元/月',
  wage_type VARCHAR(128) NOT NULL COMMENT '工资口径',
  source VARCHAR(512) DEFAULT NULL COMMENT '数据来源',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_province_year_type (province, wage_year, wage_type),
  KEY idx_wage_year (wage_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社会平均工资历史表';

INSERT INTO sys_social_average_wage (province, wage_year, annual_wage, monthly_wage, wage_type, source) VALUES
('福建省', 2024, 112185.00, ROUND(112185.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：2024年福建省城镇单位就业人员年平均工资情况'),
('福建省', 2023, 108520.00, ROUND(108520.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：2023年福建省城镇单位就业人员年平均工资情况'),
('福建省', 2022, 103803.00, ROUND(103803.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2022年城镇非私营单位就业人员年平均工资103803元'),
('福建省', 2021, 98071.00, ROUND(98071.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2021年城镇非私营单位就业人员年平均工资98071元'),
('福建省', 2020, 88149.00, ROUND(88149.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2020年城镇非私营单位就业人员年平均工资88149元'),
('福建省', 2019, 81814.00, ROUND(81814.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2019年城镇非私营单位就业人员年平均工资81814元'),
('福建省', 2018, 74316.00, ROUND(74316.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2018年城镇非私营单位就业人员年平均工资74316元'),
('福建省', 2017, 67420.00, ROUND(67420.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：福建省2017年城镇非私营单位就业人员年平均工资67420元'),
('福建省', 2016, 61973.00, ROUND(61973.00/12, 2), '城镇非私营单位就业人员年平均工资', '福建省统计局：2016年福建省城镇非私营单位就业人员年平均工资61973元'),
('福建省', 2015, 57617.00, ROUND(57617.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2014, 53418.00, ROUND(53418.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2013, 49328.00, ROUND(49328.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2012, 44979.00, ROUND(44979.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2011, 38989.00, ROUND(38989.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2010, 32647.00, ROUND(32647.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2009, 28666.00, ROUND(28666.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2008, 25702.00, ROUND(25702.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2007, 22204.00, ROUND(22204.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2006, 19376.00, ROUND(19376.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据'),
('福建省', 2005, 17146.00, ROUND(17146.00/12, 2), '城镇非私营单位就业人员年平均工资', '历史统计年鉴同口径数据')
ON DUPLICATE KEY UPDATE
  annual_wage = VALUES(annual_wage),
  monthly_wage = VALUES(monthly_wage),
  source = VALUES(source),
  updated_at = CURRENT_TIMESTAMP;
