#!/usr/bin/env bash
# Read-only: how many Galleons members earn per day (last 30 VN days), aggregated.
# Source: BigQuery mirror of galleons_ledger (hpvn-galleons skill), never Firestore.
# Prints totals and percentiles only: no usernames, no account ids.
# Usage: bash docs/galleons-income.sh [days=30]
set -euo pipefail
DAYS="${1:-30}"
Q() { bq query --use_legacy_sql=false --location=asia-southeast1 --format=pretty --max_rows=60 "$1"; }

echo "== 1. Mỗi loại giao dịch trong ${DAYS} ngày =="
Q "
SELECT reason_code, type, COUNT(*) AS n, COUNT(DISTINCT account_uid) AS accounts, SUM(ABS(amount)) AS total
FROM \`hpvnn-archive.galleons.ledger\`
WHERE DATE(created_vn) >= DATE_SUB(CURRENT_DATE('Asia/Ho_Chi_Minh'), INTERVAL ${DAYS} DAY)
GROUP BY reason_code, type ORDER BY total DESC"

echo "== 2. Thu nhập mỗi ngày của một thành viên (không tính vòng quay, vay, cược) =="
# earned: minted to the member by the forum (games, 7-day check-in, manual and bank rewards).
# Accounts that ever made a bank_withdrawal (admins/HPH) are left out.
Q "
WITH rows AS (
  SELECT account_uid, DATE(created_vn) AS d, reason_code, ABS(amount) AS a
  FROM \`hpvnn-archive.galleons.ledger\`
  WHERE DATE(created_vn) >= DATE_SUB(CURRENT_DATE('Asia/Ho_Chi_Minh'), INTERVAL ${DAYS} DAY)
), staff AS (SELECT DISTINCT account_uid FROM rows WHERE reason_code = 'bank_withdrawal'),
member AS (
  SELECT account_uid,
    COUNT(DISTINCT d) AS active_days,
    SUM(IF(reason_code IN ('game_reward','checkin_7_day','manual_reward','bank_reward'), a, 0)) AS earned,
    SUM(IF(reason_code = 'wheel_prize', a, 0)) - SUM(IF(reason_code = 'wheel_spin', a, 0)) AS wheel_net,
    SUM(IF(reason_code = 'store_purchase', a, 0)) AS store_spent
  FROM rows WHERE account_uid NOT IN (SELECT account_uid FROM staff) GROUP BY account_uid
)
SELECT
  COUNT(*) AS members,
  COUNTIF(earned > 0) AS members_earning,
  ROUND(AVG(active_days), 1) AS avg_active_days,
  ROUND(AVG(earned) / ${DAYS}, 1) AS avg_per_calendar_day,
  APPROX_QUANTILES(earned / ${DAYS}, 100)[OFFSET(50)] AS p50_per_day,
  APPROX_QUANTILES(earned / ${DAYS}, 100)[OFFSET(75)] AS p75_per_day,
  APPROX_QUANTILES(earned / ${DAYS}, 100)[OFFSET(90)] AS p90_per_day,
  APPROX_QUANTILES(SAFE_DIVIDE(earned, active_days), 100)[OFFSET(50)] AS p50_per_active_day,
  ROUND(AVG(wheel_net) / ${DAYS}, 1) AS avg_wheel_net_per_day,
  ROUND(AVG(store_spent) / ${DAYS}, 1) AS avg_store_spent_per_day
FROM member"

echo "== 3. Ví hiện tại không có trong BigQuery (galleons_accounts ~60 tài liệu); xem ACP → Báo cáo nếu cần số dư =="
