# oWAG · bộ emoji Telegram

57 emoji tĩnh, 8 emoji động, chuẩn emoji tuỳ chỉnh của Telegram (100×100 px).
Thiết kế cho kênh giao dịch: nhãn lệnh, mức giá, trạng thái, chủ đề thị trường, đánh số.

![Xem trước](dist/preview.png)

## Hệ thống thiết kế

- **Viên đặc** = chiều lệnh và đòn bẩy: LONG, SHORT, x3, x5, x10.
- **Viên viền** = mức giá: VÀO, TP1–TP3, SL, DCA, R:R.
- **Con dấu nghiêng** = kết quả cho bản tổng kết tuần: THẮNG, THUA, HÒA, HỦY.
- **Ô vuông mực** = chủ đề thị trường. **Đĩa tròn** = trạng thái lệnh.
- Màu: đen mực làm nền, vàng sâm panh là màu thương hiệu, xanh = tăng, đỏ = giảm, hổ phách = cảnh báo.

## Tệp

| Thư mục | Nội dung |
|---|---|
| `dist/static/` | PNG 100×100 nền trong suốt, tải thẳng lên Telegram |
| `dist/video/` | WEBM VP9 100×100, 2 giây, 30 khung/giây, nền trong suốt, mỗi tệp dưới 16 KB |
| `dist/svg/` | Bản vector để sửa trên Figma/Illustrator (font: Inter Display Black) |
| `dist/manifest.json` | Danh sách mã, emoji gắn kèm, từ khoá tìm kiếm |
| `dist/owag-emoji.zip` | Toàn bộ các thứ trên |

## Cách 1 · Tải lên tự động (khuyên dùng)

Không phải gửi tay 57 tệp. Cần Python 3, không cần cài thêm thư viện.

1. Tạo bot qua **@BotFather** → lấy token.
2. Lấy ID số của tài khoản sẽ sở hữu bộ emoji (qua **@userinfobot**).
3. Nhắn `/start` cho bot vừa tạo. Bỏ bước này Telegram sẽ báo lỗi người dùng.
4. Chạy:

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC..."
python3 upload/upload_pack.py --user-id 123456789
```

Kết quả: đường dẫn `https://t.me/addemoji/owag_by_<tên_bot>`. Bộ thuộc về tài khoản của bạn, quản lý tiếp qua **@Stickers**.

Chế độ:
- `--mode mixed` (mặc định): một bộ, 8 emoji có bản động dùng WEBM, còn lại PNG.
- `--mode static`: toàn bộ PNG tĩnh. Dùng nếu Telegram từ chối bộ trộn định dạng.
- `--mode video`: chỉ 8 emoji động, để làm một bộ riêng (thêm `--name owag_motion`).
- `--dry-run`: in danh sách, không gửi gì.

## Cách 2 · Thủ công qua @Stickers

1. Nhắn **@Stickers** → `/newemojipack` → chọn **Static emoji** (hoặc **Video emoji** cho thư mục `video/`).
2. Đặt tên bộ: `oWAG`.
3. Gửi từng tệp trong `dist/static/` **dạng tệp (File)**, không gửi dạng ảnh. Sau mỗi tệp, gửi emoji gắn kèm (xem cột emoji trong `manifest.json`).
4. `/publish` → chọn biểu tượng bộ (`owag_mark`) → đặt tên ngắn, ví dụ `owag`.

Emoji gắn kèm chỉ dùng để Telegram gợi ý khi gõ, không xuất hiện trong bài.

## Lưu ý khi dùng

- Muốn chèn emoji tuỳ chỉnh vào bài, tài khoản đăng bài cần Telegram Premium. Người đọc không cần Premium vẫn thấy.
- Nhóm đạt mức boost đủ cao có thể đặt một bộ emoji cho cả nhóm dùng, kể cả thành viên không có Premium. Kiểm tra trong phần cài đặt nhóm.
- Nhãn chữ (LONG, SHORT, THẮNG…) đọc rõ trên điện thoại. Trên máy tính, emoji hiện nhỏ hơn, nên đặt cạnh số liệu thay vì để đứng một mình.

## Sửa và dựng lại

Màu nằm ở bảng `C` đầu tệp `src/emoji.mjs`. Đổi màu, sửa hình, thêm emoji ngay trong tệp đó, rồi chạy:

```bash
node src/build.mjs
```

Cần Node 18+, Playwright có Chromium, ffmpeg có libvpx-vp9 và font Inter Display.

## Danh sách

### Thương hiệu (6)

| Emoji | Mã | Dùng khi | Động |
|---|---|---|---|
| <img src="dist/static/owag_mark.png" width="28"> | `owag_mark` | Mở đầu bài, chữ ký cuối bài | có |
| <img src="dist/static/owag_logo.png" width="28"> | `owag_logo` | Đầu tiêu đề, ảnh đại diện mini |  |
| <img src="dist/static/owag_word.png" width="28"> | `owag_word` | Chèn tên thương hiệu trong câu |  |
| <img src="dist/static/owag_coin.png" width="28"> | `owag_coin` | Nói về token, phần thưởng cộng đồng |  |
| <img src="dist/static/owag_eye.png" width="28"> | `owag_eye` | Đang theo dõi, chờ xác nhận | có |
| <img src="dist/static/owag_seal.png" width="28"> | `owag_seal` | Số liệu đã kiểm chứng, lệnh công khai |  |

### Lệnh & mức giá (12)

| Emoji | Mã | Dùng khi | Động |
|---|---|---|---|
| <img src="dist/static/long.png" width="28"> | `long` | Chiều mua | có |
| <img src="dist/static/short.png" width="28"> | `short` | Chiều bán | có |
| <img src="dist/static/entry.png" width="28"> | `entry` | Vùng vào lệnh |  |
| <img src="dist/static/tp1.png" width="28"> | `tp1` | Mục tiêu chốt lời 1 |  |
| <img src="dist/static/tp2.png" width="28"> | `tp2` | Mục tiêu chốt lời 2 |  |
| <img src="dist/static/tp3.png" width="28"> | `tp3` | Mục tiêu chốt lời 3 |  |
| <img src="dist/static/sl.png" width="28"> | `sl` | Điểm cắt lỗ |  |
| <img src="dist/static/dca.png" width="28"> | `dca` | Vùng trung bình giá |  |
| <img src="dist/static/rr.png" width="28"> | `rr` | Tỷ lệ lời/lỗ của kịch bản |  |
| <img src="dist/static/lev_x3.png" width="28"> | `lev_x3` | Đòn bẩy x3 |  |
| <img src="dist/static/lev_x5.png" width="28"> | `lev_x5` | Đòn bẩy x5 |  |
| <img src="dist/static/lev_x10.png" width="28"> | `lev_x10` | Đòn bẩy x10 |  |

### Trạng thái lệnh (8)

| Emoji | Mã | Dùng khi | Động |
|---|---|---|---|
| <img src="dist/static/win.png" width="28"> | `win` | Tổng kết: lệnh thắng |  |
| <img src="dist/static/loss.png" width="28"> | `loss` | Tổng kết: lệnh thua |  |
| <img src="dist/static/breakeven.png" width="28"> | `breakeven` | Tổng kết: hoà vốn |  |
| <img src="dist/static/cancel.png" width="28"> | `cancel` | Kịch bản bị huỷ, không khớp |  |
| <img src="dist/static/hit_tp.png" width="28"> | `hit_tp` | Đã chạm mục tiêu | có |
| <img src="dist/static/hit_sl.png" width="28"> | `hit_sl` | Đã dính cắt lỗ |  |
| <img src="dist/static/pending.png" width="28"> | `pending` | Lệnh chờ, chưa khớp |  |
| <img src="dist/static/live.png" width="28"> | `live` | Lệnh đang mở | có |

### Thị trường & chủ đề (19)

| Emoji | Mã | Dùng khi | Động |
|---|---|---|---|
| <img src="dist/static/candles_up.png" width="28"> | `candles_up` | Xu hướng tăng |  |
| <img src="dist/static/candles_down.png" width="28"> | `candles_down` | Xu hướng giảm |  |
| <img src="dist/static/breakout.png" width="28"> | `breakout` | Breakout |  |
| <img src="dist/static/breakdown.png" width="28"> | `breakdown` | Breakdown |  |
| <img src="dist/static/alert.png" width="28"> | `alert` | Rủi ro, tin xấu, cẩn trọng | có |
| <img src="dist/static/flash.png" width="28"> | `flash` | Tin nhanh, biến động mạnh | có |
| <img src="dist/static/liq.png" width="28"> | `liq` | Cháy tài khoản, thanh lý hàng loạt |  |
| <img src="dist/static/whale.png" width="28"> | `whale` | Ví lớn, dòng tiền lớn |  |
| <img src="dist/static/macro.png" width="28"> | `macro` | Tin vĩ mô, lãi suất, dòng vốn toàn cầu |  |
| <img src="dist/static/research.png" width="28"> | `research` | Bóc tách dự án, bài phân tích |  |
| <img src="dist/static/target.png" width="28"> | `target` | Vùng giá mục tiêu |  |
| <img src="dist/static/shield.png" width="28"> | `shield` | Quản trị rủi ro, bảo toàn vốn |  |
| <img src="dist/static/hold.png" width="28"> | `hold` | Vị thế dài hạn, khoá vốn |  |
| <img src="dist/static/pin.png" width="28"> | `pin` | Bài ghim, tổng kết tuần |  |
| <img src="dist/static/week.png" width="28"> | `week` | Bản tổng kết 7 ngày |  |
| <img src="dist/static/bell.png" width="28"> | `bell` | Báo động giá, nhắc lịch |  |
| <img src="dist/static/gem.png" width="28"> | `gem` | Đồng tiền tiềm năng |  |
| <img src="dist/static/alpha.png" width="28"> | `alpha` | Góc nhìn riêng, thông tin sớm |  |
| <img src="dist/static/invalid.png" width="28"> | `invalid` | Điều kiện phủ định luận điểm |  |

### Đánh số & mũi tên (12)

| Emoji | Mã | Dùng khi | Động |
|---|---|---|---|
| <img src="dist/static/n1.png" width="28"> | `n1` | Đánh số ý trong bài |  |
| <img src="dist/static/n2.png" width="28"> | `n2` | Đánh số ý trong bài |  |
| <img src="dist/static/n3.png" width="28"> | `n3` | Đánh số ý trong bài |  |
| <img src="dist/static/n4.png" width="28"> | `n4` | Đánh số ý trong bài |  |
| <img src="dist/static/n5.png" width="28"> | `n5` | Đánh số ý trong bài |  |
| <img src="dist/static/n6.png" width="28"> | `n6` | Đánh số ý trong bài |  |
| <img src="dist/static/n7.png" width="28"> | `n7` | Đánh số ý trong bài |  |
| <img src="dist/static/n8.png" width="28"> | `n8` | Đánh số ý trong bài |  |
| <img src="dist/static/n9.png" width="28"> | `n9` | Đánh số ý trong bài |  |
| <img src="dist/static/arrow_up.png" width="28"> | `arrow_up` | Tăng, vượt |  |
| <img src="dist/static/arrow_down.png" width="28"> | `arrow_down` | Giảm, thủng |  |
| <img src="dist/static/arrow_right.png" width="28"> | `arrow_right` | Gạch đầu dòng, dẫn ý |  |
