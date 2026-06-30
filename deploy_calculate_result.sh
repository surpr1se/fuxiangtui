#!/usr/bin/env bash
set -euo pipefail
cd /opt/fuxiangtui-pension
ts=$(date +%Y%m%d_%H%M%S)
mkdir -p backup sql config
APP_YML="config/application.yml"
DB_URL=$(awk -F'url:' '/^[[:space:]]*url:[[:space:]]*jdbc:mysql/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
DB_NAME=$(printf "%s" "$DB_URL" | sed -E 's#.*jdbc:mysql://[^/]+/([^?[:space:]]+).*#\1#')
DB_USER=$(awk -F'username:' '/^[[:space:]]*username:/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
DB_PASS=$(awk -F'password:' '/^[[:space:]]*password:/ {gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$APP_YML")
MYSQL=(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME")
MYSQLDUMP=(mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME")
if "${MYSQL[@]}" -Nse "SHOW TABLES LIKE 'pension_calculate_result'" | grep -q pension_calculate_result; then
  "${MYSQLDUMP[@]}" pension_calculate_result > "backup/pension_calculate_result_before_$ts.sql"
fi
"${MYSQL[@]}" < sql/20260605_calculate_result.sql
count=$("${MYSQL[@]}" -Nse "SELECT COUNT(*) FROM pension_calculate_result")
echo "SQL_OK count=$count"
if [ ! -s fuxiangtui-pension-server-1.0.0.jar.new ]; then
  echo "ERROR: new jar missing" >&2
  exit 2
fi
cp -a fuxiangtui-pension-server-1.0.0.jar "backup/fuxiangtui-pension-server-1.0.0.jar.$ts.bak"
mv -f fuxiangtui-pension-server-1.0.0.jar.new fuxiangtui-pension-server-1.0.0.jar
old_pid=$(ps -ef | awk '/java/ && /fuxiangtui-pension-server-1.0.0.jar/ && !/awk/ {print $2}' | head -1 || true)
[ -n "${old_pid:-}" ] && kill "$old_pid" || true
sleep 5
[ -n "${old_pid:-}" ] && ps -p "$old_pid" >/dev/null 2>&1 && kill -9 "$old_pid" || true
[ -f app.log ] && cp app.log "backup/app.log.$ts.bak" || true
nohup java -jar /opt/fuxiangtui-pension/fuxiangtui-pension-server-1.0.0.jar --spring.config.additional-location=file:/opt/fuxiangtui-pension/config/application.yml > /opt/fuxiangtui-pension/app.log 2>&1 &
echo $! > app.pid
echo "STARTED_PID=$(cat app.pid)"
sleep 12
echo "---SAVE---"
curl -sS -m 8 -X POST 'http://127.0.0.1:8080/api/v1/calculate-result/save' -H 'Content-Type: application/json' -d '{"userId":1,"openid":"test-openid","title":"接口部署自测","monthlyPension":3500.88,"basicPension":2500.00,"personalAccountPension":1000.88,"personalAccountAmount":139122.32,"paymentYears":20,"paymentMonths":139,"retireAge":60,"result":{"monthlyPension":3500.88,"remark":"deploy-test"}}'
echo
echo "---HISTORY---"
curl -sS -m 8 'http://127.0.0.1:8080/api/v1/calculate-result/history?userId=1&page=1&pageSize=5'
echo
echo "---OPENAPI_CHECK---"
curl -sS -m 8 'http://127.0.0.1:8080/v3/api-docs' | grep -o '/api/v1/calculate-result/[^"}]*' | sort -u || true
echo
echo "---LOG_TAIL---"
tail -40 app.log
