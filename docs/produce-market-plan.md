# Quầy chợ bác Hagrid — bán nông sản lấy Galleons

> 26/10/2026 · Claude Code (Anthropic). Chủ dự án duyệt: mở từ cấp 25, giá «cao hơn tí» (+1 G mỗi giờ lớn),
> «giới hạn số lượng bán», trần 2.500 G/ngày. Sản phẩm sinh vật chưa bán.

## Luật

| Hạng mục | Giá trị |
|---|---|
| Mở khóa | Cấp 25, chỉ khi chơi với ví HPVN (server). Chơi trên máy / ví xem thử không có quầy |
| Được bán | Chỉ nông sản đã gặt (32 loại cây). Không bán khẩu phần, bộ vật liệu, nước, vật phẩm cao cấp, trang trí, sản vật |
| Giá | `ceil(giá hạt/3 + 5/9 G nước + 1 G × số giờ lớn)`, tính trên server, không áp sale |
| Giới hạn số lượng | 100 cái mỗi loại cây mỗi ngày |
| Trần | 2.500 G mỗi tài khoản mỗi ngày, cộng mọi loại cây |
| Xả kho | Owner 28/10/2026: mỗi tài khoản được **một lần** bán hết nông sản trong kho, không tính 100 cái/loại và 2.500 G/ngày, không cộng vào bộ đếm ngày (`garden.marketCleared`). Sau đó áp trần như trên. Nút cần bấm hai lần |
| Ngày | Giờ Việt Nam trên server |
| Sổ cái | Ghi có `garden_sale` (`sourceType: hagrid-garden-market`); ACP «Thu chi» tính vào chi của dòng Khu vườn |
| Công tắc | `galleons_config/garden.marketOff = true` đóng quầy ngay; nút phanh Gringotts cũng đóng |

Bảng giá: Bí ngô 3 · cây 2 giờ 4 · cây 3 giờ cấp 6–20 là 5, cấp 28 trở lên là 6 · cây 6 giờ 9 · cây 8 giờ 11 G.
Ước tính (giờ lớn đã giảm một nửa): cấp 25 chơi 2 lượt/ngày bán khoảng 810 G; cấp 110 khoảng 6,5 giờ cày mới chạm trần.

## Hàng giá cao (chủ dự án 06/11/2026)

| Hạng mục | Giá trị |
|---|---|
| Nông sản chất lượng cao | Giá cây × bậc thành thạo, cấp số nhân: Tập sự ×2 · Thạo nghề ×4 · Bậc thầy ×8 |
| Sản vật sinh vật | Bán được: `ceil(cấp loài / 3)` G (Len quái lùng nhùng 4 · Vảy Rồng rụng 32); ×2 khi bé đang vui (tâm trạng ≥ 80) |
| Trần riêng | 5.000 G/ngày cho hàng giá cao; 10.000 G khi có ít nhất một cây Bậc thầy. Không trừ vào trần 2.500 G của hàng thường |
| Giới hạn số lượng | Như cũ, 100 cái mỗi loại mỗi ngày (cả sản vật) |
| Xả kho | Không đổi: giá gốc, chỉ nông sản |
| Bán chính con thú | Không làm: nhận nuôi chỉ tốn 3 khẩu phần, bán thú sẽ thành vòng nuôi–bán lặp lại và mất gắn kết, trò đã dạy |
| Mã | `garden-market-core.js` `TIER_MULT`, `PRODUCE_PRICES`, `PREMIUM_CAP(_MASTER)`, `marketQuality`; phản hồi `market.quality` |

| # | Đường lách | Rào chắn | Test |
|---|---|---|---|
| 41 | Mua Bữa thượng hạng / Tiệc chuồng để thú ra sản vật nhanh rồi bán | Giá sản vật lúc bé vui × 2 cái < bữa mua rẻ nhất khi giảm 50% (Tiệc chuồng 3.200 G / 12 con × 0,5 ≈ 133 G) | `produce sells … no bought meal pays for itself` |
| 42 | Đổi loại cây để lách trần giá cao | Trần tính theo tài khoản | `premium cap … switching crops shares it` |
| 43 | Mưa suối thần gặt cả vườn rồi bán ×8 | Giá ≥ 12.600 G kể cả giảm 50%, cao hơn trần 10.000 G | — |
| 44 | Bán lúc bé vui rồi để bé buồn | Hợp lệ: chăm bé là công sức; giá tính trên server lúc bán | — |

## Rào chắn (nối tiếp §10.5 của `level-500-roadmap.md`)

| # | Đường lách | Rào chắn | Test |
|---|---|---|---|
| 21 | Mua hạt rẻ, trồng, bán lấy lời | Trần 2.500 G/ngày; phần lời cần thời gian cây lớn | `garden-market.test.js` prices |
| 22 | Đổi loại cây để lách giới hạn | Trần tính theo tài khoản, không theo loại | switching crops |
| 23 | Nhiều tab, gửi lại lệnh | `requestId` idempotent; giới hạn đếm trong cùng giao dịch | repeated requestId, two tabs |
| 24 | Bán món đã mua bằng Galleons | Chỉ cây bán được; không cây nào có trong cửa hàng | only harvested crops |
| 25 | Chơi trên máy (hạt miễn phí) rồi bán | Chỉ server bán; engine máy khách không có lệnh bán | — |
| 26 | Nông sản miễn phí (quà, đơn, lễ hội) | Cùng trần 2.500 G | — |
| 27 | Tài khoản phụ | Phải lên cấp 25 thật; thành viên không chuyển Galleons cho nhau được (chỉ tặng lượt quay, có `wheel-gift-guard`) | level gate |
| 28 | Đổi múi giờ, chỉnh đồng hồ | Ngày và giá tính trên server | VN day |
| 29 | Nuôi tài khoản mới để bán | Gộp vào #27: cấp 25 cần hàng tuần chơi | level gate |
| 30 | Bot bấm liên tục | `moneyCallable` 120 lệnh/phút/tài khoản + 100 cái/loại + trần ngày; theo dõi BigQuery `reason_code = 'garden_sale'` | — |
| 31 | Lạm phát vượt dự tính | `marketOff`, nút phanh Gringotts | stall closes |
| 32 | Vượt 100 cái/loại | Đếm trong cùng giao dịch với trần | per crop |

## Mã

- Server HPVN: `functions/games/garden-market-core.js` (giá, giới hạn), `garden-market-handlers.js`
  (`sellHagridGardenCrops`, `moneyCallable`), `market` trong mọi phản hồi khu vườn; ma trận tài chính #1062.
- Game: `garden-v05/garden-market-ui.mjs` (tab «Quầy chợ» trong cửa hàng), `garden-emulator-client.mjs` `sell`.

## Theo dõi sau phát hành

```sql
SELECT DATE(created_vn) d, COUNT(DISTINCT account_uid) members, SUM(amount) galleons
FROM `hpvnn-archive.galleons.ledger` WHERE reason_code = 'garden_sale' GROUP BY d ORDER BY d DESC
```
Sau 7 ngày xem tổng G phát ra và ai chạm trần nhiều ngày liền; trần và giới hạn là hằng số trong `garden-market-core.js`.
