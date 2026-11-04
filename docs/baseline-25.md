# Số liệu gốc trước bản 25.0 (S0)

> Đo 04/11/2026 (giờ VN, ngày 04/11 mới qua nửa ngày) · Claude Code (Anthropic) · chỉ đọc, chỉ số tổng hợp, không tên hay uid.
> Nguồn: BigQuery `hpvnn-archive.galleons.ledger` (bản sao sổ Galleons) qua `docs/garden-baseline-bq.sh`. Không đọc Firestore.
> Khu vườn mở trên production 18/10/2026, nên «30 ngày» thực tế là 18 ngày (18/10–04/11).

## Cách hiểu

Mỗi dòng sổ của vườn (`hagrid-garden-store`, `-build`, `-market`, `-fire`) là một lần mua, xây, bán hay dập lửa. «Ngày chơi» dưới đây là **ngày có ít nhất một giao dịch vườn**. Ai chỉ gieo, gặt, cho ăn bằng đồ sẵn có mà không mua gì thì không hiện ra, nên số người chơi và tỉ lệ quay lại là **cận dưới**. Vì hạt và nước phải mua hằng ngày, phần lớn ngày chơi thật vẫn có giao dịch.

## 1. Người chơi và cấp

23 thành viên đã có giao dịch vườn. Cấp lấy theo món có cấp mở cao nhất họ từng mua, nên là **cấp tối thiểu**:

| Cấp | Thành viên |
|---|---|
| 1–9 | 8 |
| 10–24 | 1 |
| 25–49 | 6 |
| 50–99 | 6 |
| 100–129 | 1 |
| 130–199 | 1 |
| 200+ | 0 |

Hệ quả cho 25.0: bậc trách nhiệm (S5, từ cấp 130) hiện chạm tới khoảng 1–2 người; đa số ở 25–99. Đồ lễ hội cấp 1 và giá theo cấp (S1) chạm tất cả.

Cấp thật cần đọc `garden_states.progression.level`: `docs/garden-baseline.mjs` làm việc đó (2 lệnh `count()`, rồi đọc có mặt nạ trường, từ chối khi quá 500 vườn hoặc 5.000 tài liệu ngày; in D1/D7 theo ngày tạo vườn và `garden_daily`). Lệnh đọc Firestore production bị chặn trong phiên S0; chủ dự án chạy:

```bash
GARDEN_HPVNN_ROOT=/Users/thachanh/Downloads/HPVNN.nosync node docs/garden-baseline.mjs --project hpvnn-archive 30
```

## 2. Quay lại

Đoàn = 23 thành viên, tính từ ngày giao dịch vườn đầu tiên.

| Chỉ số | Kết quả |
|---|---|
| D1 (quay lại đúng ngày hôm sau) | 19/23 = **83 %** |
| D7 (có mặt đúng ngày thứ 7) | 14/22 = **64 %** |
| Quay lại trong 7 ngày đầu | 19/22 = 86 % |
| Ngày chơi mỗi người (trung vị / p75 / cao nhất, trên 18 ngày) | 14 / 17 / 18 |
| Có mặt trong 3 ngày gần nhất | 14/23 |

Người chơi mỗi ngày (có giao dịch): 16–19 trong tuần đầu (19–24/10), ổn định 13–15 từ 25/10 (04/11 mới nửa ngày: 8).

**Phiên mỗi ngày: chưa đo.** Sổ Galleons và `garden_daily` chỉ ghi ngày, không ghi lượt mở. Số lần gọi `getHagridGarden` (mỗi lần mở vườn gọi một lần) chia cho người chơi trong ngày cho ra số phiên; lệnh đọc Cloud Logging (production) chủ dự án chạy:

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="gethagridgarden" AND httpRequest.requestMethod="POST"' --project hpvnn-archive --freshness=30d --format='value(timestamp)' | cut -c1-10 | sort | uniq -c
```

## 3. Dòng Galleons của Khu vườn (18/10–04/11)

| Nguồn | Chiều | Thành viên | Galleons | Trung vị mỗi dòng |
|---|---|---|---|---|
| Cửa hàng (`hagrid-garden-store`) | chi | 23 | 1.502.431 | 50 |
| Xây/trang trí (`hagrid-garden-build`) | chi | 11 | 28.560 | 100 |
| Dập lửa (`hagrid-garden-fire`) | chi | 9 | 900 | 10 |
| Quầy chợ (`hagrid-garden-market`) | thu | 11 | 68.553 | 275 |

Vườn hút ròng **≈ 1,46 triệu G** trong 18 ngày; quầy chợ trả lại 4,6 % số chi ở cửa hàng.

Theo tuần (thứ Hai đầu tuần):

| Tuần | Cửa hàng | Xây | Chợ (thu) | Dập lửa | Người chi cửa hàng |
|---|---|---|---|---|---|
| 12/10 (chỉ 18/10) | 377 | – | – | – | 5 |
| 19/10 | 698.938 | 3.060 | – | – | 21 |
| 26/10 | 551.935 | 17.960 | 50.274 | 310 | 17 |
| 02/11 (3,5 ngày) | 251.181 | 7.540 | 18.279 | 590 | 14 |

Mỗi ngày chơi (251 lượt thành viên-ngày): chi trung vị **519 G**, p90 11.730 G, trung bình 6.103 G; bán trung bình 273 G. Phân bố rất lệch: vài người chi lớn kéo trung bình lên gấp ~12 lần trung vị.

So với thu nhập (roadmap §3, `docs/galleons-income.sh`): trung vị 32.430 G/thành viên/ngày, tự chơi 101 G/ngày. Trung vị chi ở vườn (519 G/ngày chơi) chỉ khoảng 1,6 % thu nhập trung vị: đây là căn cứ của S1 nhân giá.

## 4. Mốc để so sau 25.0

| Mốc | Trước 25.0 | Đo lại |
|---|---|---|
| Người chơi có giao dịch/ngày | 13–15 | 7 ngày sau mỗi đợt |
| D1 / D7 | 83 % / 64 % | cùng script, đoàn mới từ 01/12 |
| Chi trung vị/ngày chơi | 519 G | sau S1 |
| Chi ròng của vườn/tuần | ~0,5–0,7 triệu G | sau S1, S5 |
| Thu quầy chợ / chi cửa hàng | 4,6 % | sau S1 (giá chợ không đổi) |

Chạy lại: `bash docs/garden-baseline-bq.sh` (BigQuery, không tốn đọc Firestore).
