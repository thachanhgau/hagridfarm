# Mô phỏng cấp 1–500 (21/10/2026)

Dùng cho `docs/level-500-roadmap.md`. Không chạy trong game; chỉ chạy trên một **bản sao** của `garden-v05`.

```sh
rm -rf /tmp/hf-sim && cp -R garden-v05 /tmp/hf-sim
cp docs/level-500-sim/run500.mjs /tmp/hf-sim/
cd /tmp/hf-sim && patch -p1 < ../path/to/docs/level-500-sim/sim-hooks.patch   # đường dẫn tuyệt đối tới file patch
B='"t99":40000,"b":110,"days":300,"cap":2,"xpm":{"1":1.5,"2":1.4,"3":1.4,"6":1.2},"meal":3,"job":3,"halve":true'
node run500.mjs "{$B}" 8,21            # 2 lượt/ngày (08:00, 21:00)
node run500.mjs "{$B}" n20:7:23        # người cày: 20 lượt đều nhau 07:00–23:00, chọn cây nhiều XP/giờ nhất
node run500.mjs "{$B,\"rain\":[13.4],\"raincost\":6000}" n20:7:23   # thêm «Mưa suối thần» 1 lần/ngày
```

Tham số: `t99`/`b` đường XP; `cap` trần giá hạt; `xpm` hệ số XP theo giờ cây; `meal`/`job`/`halve` sinh vật và chế biến;
`xpcap` trần XP mềm; `felix` [từ giờ, đến giờ, thưởng] thuốc nhân XP; `rain` giờ dùng cả vườn chín ngay.
`sim-hooks.patch` thêm các móc chỉ dành cho mô phỏng (trần cấp 500, 18 thửa, globalThis.__*), không đưa vào game.
`levels-500.csv`: XP mỗi cấp cũ và mới (cấp 1–20 giữ nguyên; 21–99 tăng hình học tới 40.000; 100–499 = 40.000 + 110 × (L − 99)).
