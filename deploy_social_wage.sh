#!/usr/bin/env bash
set -euo pipefail
cd /opt/fuxiangtui-pension
ts=$(date +%Y%m%d_%H%M%S)
mkdir -p backup sql
APP_YML="target/classes/application.yml"
DB_URL=$(awk -F'url:' '/^[[:space:]]*url:[[:space:]]*jdbc:mysql/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
DB_NAME=$(printf "%s" "$DB_URL" | sed -E 's#.*jdbc:mysql://[^/]+/([^?[:space:]]+).*#\1#')
DB_USER=$(awk -F'username:' '/^[[:space:]]*username:/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
DB_PASS=$(awk -F'password:' '/^[[:space:]]*password:/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
MYSQL=(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME")
MYSQLDUMP=(mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME")
if "${MYSQL[@]}" -Nse "SHOW TABLES LIKE 'sys_social_average_wage'" | grep -q sys_social_average_wage; then
  "${MYSQLDUMP[@]}" sys_social_average_wage > "backup/sys_social_average_wage_before_$ts.sql"
  before_count=$("${MYSQL[@]}" -Nse "SELECT COUNT(*) FROM sys_social_average_wage WHERE province='福建省' AND wage_type='城镇非私营单位就业人员年平均工资' AND wage_year BETWEEN 2005 AND 2024")
else
  before_count=0
fi
"${MYSQL[@]}" < sql/20260603_social_average_wage.sql
after_count=$("${MYSQL[@]}" -Nse "SELECT COUNT(*) FROM sys_social_average_wage WHERE province='福建省' AND wage_type='城镇非私营单位就业人员年平均工资' AND wage_year BETWEEN 2005 AND 2024")
echo "SQL_OK before=$before_count after=$after_count"

if [ ! -s fuxiangtui-pension-server-1.0.0.jar.new ]; then
  echo "ERROR: new jar missing" >&2
  exit 2
fi
cp -a fuxiangtui-pension-server-1.0.0.jar "backup/fuxiangtui-pension-server-1.0.0.jar.$ts.bak"
mv -f fuxiangtui-pension-server-1.0.0.jar.new fuxiangtui-pension-server-1.0.0.jar
old_pid=$(ps -ef | awk '/java/ && /fuxiangtui-pension-server-1.0.0.jar/ && !/awk/ {print $2}' | head -1 || true)
if [ -n "${old_pid:-}" ]; then
  kill "$old_pid" || true
  for i in {1..20}; do
    if ps -p "$old_pid" >/dev/null 2>&1; then sleep 1; else break; fi
  done
  if ps -p "$old_pid" >/dev/null 2>&1; then kill -9 "$old_pid" || true; fi
fi
[ -f app.log ] && cp app.log "backup/app.log.$ts.bak" || true
nohup java -jar /opt/fuxiangtui-pension/fuxiangtui-pension-server-1.0.0.jar > /opt/fuxiangtui-pension/app.log 2>&1 &
new_pid=$!
echo "$new_pid" > app.pid
echo "STARTED_PID=$new_pid"
sleep 10
echo "---PROCESS---"
ps -ef | awk '/java/ && /fuxiangtui-pension-server-1.0.0.jar/ && !/awk/ {print}' || true
echo "---PORT---"
ss -lntp | grep ':8080' || true
echo "---SOCIAL_WAGE_HISTORY---"
curl -sS -m 8 'http://127.0.0.1:8080/api/v1/system-param/social-wage?province=%E7%A6%8F%E5%BB%BA%E7%9C%81&startYear=2023&endYear=2024'
echo
echo "---PREVIOUS_YEAR---"
curl -sS -m 8 'http://127.0.0.1:8080/api/v1/system-param/social-wage/latest-previous-year?province=%E7%A6%8F%E5%BB%BA%E7%9C%81&baseYear=2025'
echo
echo "---LOG_TAIL---"
tail -60 app.log
