-- 回滚福建省近20年社会平均工资初始化数据。
-- 注意：仅删除本次写入的福建省/城镇非私营口径/2005-2024 年数据；保留表结构，避免误删其他省份或未来数据。
DELETE FROM sys_social_average_wage
WHERE province = '福建省'
  AND wage_type = '城镇非私营单位就业人员年平均工资'
  AND wage_year BETWEEN 2005 AND 2024;
