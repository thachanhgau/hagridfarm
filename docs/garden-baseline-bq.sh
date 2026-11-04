#!/usr/bin/env bash
# Read-only garden baseline from the BigQuery mirror of galleons_ledger (no Firestore reads).
# Every garden ledger row (store, build, market, fire) marks a day the member played and spent/sold.
# Level here is a LOWER BOUND: the highest unlock level among items the member ever bought.
# Prints aggregates only: no usernames, no account ids.  Usage: bash docs/garden-baseline-bq.sh
set -euo pipefail
cd "$(dirname "$0")/../garden-v05"
LEVELS=$(node --input-type=module -e '
const all={};for(const f of ["garden-store-catalog.mjs","premium-products.mjs","special-products.mjs"]){const m=await import("./"+f);
 for(const v of Object.values(m)){const l=Array.isArray(v)?v:(v&&typeof v==="object"?Object.values(v):[]);for(const i of l)if(i?.id&&Number.isFinite(i.level))all[i.id]??=i.level;}}
process.stdout.write(Object.entries(all).map(([k,v])=>`STRUCT("${k}" AS id, ${v} AS lvl)`).join(","));')
Q() { bq query --use_legacy_sql=false --location=asia-southeast1 --format=pretty --max_rows=80 "$1" 2>&1 | grep -v 'Waiting on'; }
G='WITH g AS (SELECT account_uid, DATE(created_vn) AS d, source_type, reason_code, type, ABS(amount) AS a, JSON_VALUE(data, "$.itemId") AS item
  FROM `hpvnn-archive.galleons.ledger` WHERE source_type LIKE "hagrid-garden%")'

echo "== 1. Dòng Galleons của Khu vườn theo tuần (thứ Hai) =="
Q "$G SELECT DATE_TRUNC(d, WEEK(MONDAY)) AS week, source_type, COUNT(*) AS n, COUNT(DISTINCT account_uid) AS members, SUM(a) AS galleons
FROM g GROUP BY 1, 2 ORDER BY 1, 2"

echo "== 2. Tổng từ ngày mở: chi (debit) và thu (credit) =="
Q "$G SELECT type, source_type, COUNT(DISTINCT account_uid) AS members, SUM(a) AS galleons,
 APPROX_QUANTILES(a, 100)[OFFSET(50)] AS p50_row FROM g GROUP BY 1, 2 ORDER BY galleons DESC"

echo "== 3. Chi mỗi thành viên mỗi ngày chơi (cửa hàng + xây + dập lửa) =="
Q "$G, m AS (SELECT account_uid, d, SUM(IF(type = 'debit', a, 0)) AS spent, SUM(IF(type = 'credit', a, 0)) AS sold FROM g GROUP BY 1, 2)
SELECT COUNT(*) AS member_days, APPROX_QUANTILES(spent, 100)[OFFSET(50)] AS p50_spent, APPROX_QUANTILES(spent, 100)[OFFSET(90)] AS p90_spent,
 ROUND(AVG(spent)) AS avg_spent, ROUND(AVG(sold)) AS avg_sold FROM m"

echo "== 4. Thành viên có giao dịch vườn mỗi ngày (DAU người chi) =="
Q "$G SELECT d, COUNT(DISTINCT account_uid) AS members FROM g GROUP BY 1 ORDER BY 1"

echo "== 5. Ngày có giao dịch vườn mỗi thành viên; quay lại D1/D7 theo ngày giao dịch đầu =="
Q "$G, a AS (SELECT account_uid, MIN(d) AS first_day, COUNT(DISTINCT d) AS days, ARRAY_AGG(DISTINCT d) AS ds FROM g GROUP BY 1)
SELECT COUNT(*) AS members, APPROX_QUANTILES(days, 100)[OFFSET(50)] AS p50_days, APPROX_QUANTILES(days, 100)[OFFSET(75)] AS p75_days, MAX(days) AS max_days,
 COUNTIF(DATE_ADD(first_day, INTERVAL 1 DAY) < CURRENT_DATE('Asia/Ho_Chi_Minh')) AS d1_cohort,
 COUNTIF(DATE_ADD(first_day, INTERVAL 1 DAY) < CURRENT_DATE('Asia/Ho_Chi_Minh') AND DATE_ADD(first_day, INTERVAL 1 DAY) IN UNNEST(ds)) AS d1_back,
 COUNTIF(DATE_ADD(first_day, INTERVAL 7 DAY) < CURRENT_DATE('Asia/Ho_Chi_Minh')) AS d7_cohort,
 COUNTIF(DATE_ADD(first_day, INTERVAL 7 DAY) < CURRENT_DATE('Asia/Ho_Chi_Minh') AND DATE_ADD(first_day, INTERVAL 7 DAY) IN UNNEST(ds)) AS d7_back,
 COUNTIF(DATE_ADD(first_day, INTERVAL 7 DAY) < CURRENT_DATE('Asia/Ho_Chi_Minh') AND EXISTS(SELECT 1 FROM UNNEST(ds) x WHERE x > first_day AND x <= DATE_ADD(first_day, INTERVAL 7 DAY))) AS within7_back,
 COUNTIF(DATE_DIFF(CURRENT_DATE('Asia/Ho_Chi_Minh'), (SELECT MAX(x) FROM UNNEST(ds) x), DAY) <= 2) AS active_last_3_days
FROM a"

echo "== 6. Cấp tối thiểu (món cấp cao nhất từng mua) =="
Q "$G, lv AS (SELECT * FROM UNNEST([${LEVELS}])),
m AS (SELECT account_uid, MAX(lvl) AS level FROM g JOIN lv ON g.item = lv.id GROUP BY 1)
SELECT CASE WHEN level < 10 THEN '01-09' WHEN level < 25 THEN '10-24' WHEN level < 50 THEN '25-49' WHEN level < 100 THEN '50-99'
 WHEN level < 130 THEN '100-129' WHEN level < 200 THEN '130-199' WHEN level < 300 THEN '200-299' ELSE '300-500' END AS band,
 COUNT(*) AS members FROM m GROUP BY 1 ORDER BY 1"
