// «Sản phẩm đặc biệt»: 30 decorations from the books (art and lore: special-products-assets/manifest.json,
// runtime sprites in decor-assets-manifest.json). Decoration only: no XP, yield, power or reward.
// PROPOSED prices and unlock levels, not approved by the owner: the HPVN server lists them but does not sell
// them yet (`forSale: false` there); only the in-memory preview wallet sells them. Server copy:
// HPVNN functions/games/garden-wallet-catalog.js (a parity test compares both).
export const SPECIAL_COLLECTION = 'special';
export const SPECIAL_PRICES_APPROVED = false;

export const BOOK_TITLES = Object.freeze({
  1: 'Hòn Đá Phù Thủy',
  2: 'Phòng Chứa Bí Mật',
  3: 'Tên Tù Nhân Ngục Azkaban',
  4: 'Chiếc Cốc Lửa',
  5: 'Hội Phượng Hoàng',
  6: 'Hoàng Tử Lai',
  7: 'Bảo Bối Tử Thần',
});

// [id, label, level, price, footprint [cols, rows] in the default view, book, chapter, short lore]
const ROWS = [
  ['sp_sorting_hat', 'Nón Phân Loại trên ghế', 25, 1400, [1, 1], 1, 7, 'Nón Phân Loại đặt trên ghế trong lễ phân loại.'],
  ['sp_monster_book', 'Sách Quái Vật về Quái Vật', 25, 1400, [1, 1], 3, 1, 'Cuốn sách Hagrid gửi tặng Harry cho môn Chăm Sóc Sinh Vật Huyền Bí.'],
  ['sp_hagrid_umbrella', 'Góc ô hồng của Hagrid', 25, 2200, [2, 1], 1, 4, 'Chiếc ô hồng của Hagrid.'],
  ['sp_deluminator', 'Cái Tắt-Sáng', 28, 1500, [1, 1], 7, 7, 'Dumbledore để lại dụng cụ thu ánh sáng cho Ron.'],
  ['sp_deathday_cake', 'Bánh ngày giỗ Nick Suýt Mất Đầu', 30, 2400, [2, 1], 2, 8, 'Bánh hình bia mộ trong tiệc ngày giỗ thứ 500 của Nick.'],
  ['sp_time_turner', 'Cái Xoay Thời Gian', 32, 1800, [1, 1], 3, 21, 'Dụng cụ Hermione dùng cùng Harry để quay lại thời gian.'],
  ['sp_hand_glory', 'Bàn Tay Vẻ Vang', 34, 1600, [1, 1], 2, 4, 'Cổ vật trong tiệm Borgin và Burkes.'],
  ['sp_marauders_map', 'Bản đồ của Đạo tặc', 35, 2700, [2, 1], 3, 10, 'Fred và George trao cho Harry bản đồ các lối đi bí mật.'],
  ['sp_cursed_opal_necklace', 'Dây chuyền opal bị nguyền', 36, 1800, [1, 1], 6, 12, 'Dây chuyền khiến Katie Bell bị nguyền.'],
  ['sp_goblet_fire', 'Chiếc Cốc Lửa', 38, 2100, [1, 1], 4, 16, 'Chiếc cốc gỗ chọn các quán quân Tam Pháp Thuật.'],
  ['sp_riddle_diary', 'Nhật ký Riddle và nanh Tử Xà', 40, 2200, [1, 1], 2, 17, 'Harry dùng nanh Tử Xà phá hủy quyển nhật ký.'],
  ['sp_wizard_chess_knight', 'Quân mã cờ phù thủy', 40, 3000, [2, 1], 1, 16, 'Bàn cờ phù thủy khổng lồ bảo vệ Hòn Đá Phù Thủy.'],
  ['sp_fawkes_perch', 'Cầu đậu phượng hoàng Fawkes', 42, 2400, [1, 1], 2, 12, 'Phượng hoàng Fawkes trong văn phòng Dumbledore.'],
  ['sp_gaunt_ring', 'Nhẫn gia tộc Gaunt', 44, 2200, [1, 1], 6, 10, 'Chiếc nhẫn gia tộc Gaunt.'],
  ['sp_pensieve', 'Cái Tưởng Ký', 46, 3300, [2, 1], 4, 30, 'Chậu đá chứa và xem ký ức trong văn phòng Dumbledore.'],
  ['sp_slytherin_locket', 'Mề đay Slytherin', 48, 2400, [1, 1], 7, 19, 'Chiếc mề đay được phá hủy bằng thanh gươm.'],
  ['sp_norbert_egg', 'Trứng rồng Norbert bên lò sưởi', 50, 3600, [2, 1], 1, 14, 'Trứng rồng được ấp trong lò sưởi nhà Hagrid.'],
  ['sp_hufflepuff_cup', 'Chiếc cúp Hufflepuff', 52, 2400, [1, 1], 7, 26, 'Chiếc cúp lấy khỏi hầm Lestrange ở Gringotts.'],
  ['sp_mirror_erised', 'Tấm gương Ảo Ảnh', 54, 4200, [2, 1], 1, 12, 'Tấm gương cho thấy điều người xem khao khát nhất.'],
  ['sp_ravenclaw_diadem', 'Vương miện Ravenclaw', 56, 2700, [1, 1], 7, 31, 'Vương miện thất lạc trong Phòng Theo Yêu Cầu.'],
  ['sp_vanishing_cabinet', 'Tủ Biến Mất', 58, 4200, [2, 1], 6, 27, 'Chiếc tủ Draco sửa để nối Hogwarts với Borgin và Burkes.'],
  ['sp_sword_gryffindor', 'Thanh gươm Gryffindor', 60, 3300, [1, 1], 2, 17, 'Thanh gươm xuất hiện từ Nón Phân Loại.'],
  ['sp_buckbeak_pumpkins', 'Bằng-Mã bên vườn bí ngô', 62, 5400, [2, 2], 3, 21, 'Bằng-Mã được giải cứu ở khu nhà Hagrid.'],
  ['sp_snitch_resurrection_stone', 'Snitch giữ Hòn Đá Phục Sinh', 64, 3900, [2, 1], 7, 34, 'Harry mở quả Snitch trước khi vào Rừng Cấm.'],
  ['sp_aragog_hollow', 'Hang tơ Aragog', 66, 5700, [2, 2], 2, 15, 'Aragog và bầy nhện trong Rừng Cấm.'],
  ['sp_sirius_motorbike', 'Xe máy bay của Sirius', 70, 6000, [3, 1], 1, 1, 'Chiếc xe máy Hagrid dùng đưa Harry tới đường Privet.'],
  ['sp_department_veil', 'Vòm màn che ở Bộ Pháp Thuật', 74, 6300, [2, 2], 5, 34, 'Vòm đá có màn che trong Sở Bảo Mật.'],
  ['sp_chamber_serpent_door', 'Cánh cửa Phòng Chứa Bí Mật', 78, 6800, [3, 1], 2, 16, 'Vách đá hai con rắn, mở bằng Xà Ngữ.'],
  ['sp_knight_bus', 'Xe Đò Hiệp Sĩ', 84, 7800, [3, 1], 3, 3, 'Chiếc xe buýt ba tầng đón Harry rời nhà Dursley.'],
  ['sp_whomping_anglia', 'Liễu Roi và chiếc Ford Anglia', 90, 9000, [3, 2], 2, 5, 'Harry và Ron đâm xe vào cây Liễu Roi.'],
];

export const SPECIAL_PRODUCTS = Object.freeze(ROWS.map(([id, label, level, price, footprint, book, chapter, lore]) => Object.freeze({
  id, kind: 'decoration', collection: SPECIAL_COLLECTION, decorationId: id, icon: id, label, level, price, quantity: 1, dailyLimit: 1,
  footprint: Object.freeze(footprint), book, chapter, lore,
  description: `${lore} (${BOOK_TITLES[book]} · chương ${chapter}) · Sản phẩm đặc biệt, chỉ để trang trí.`,
})));

/** Footprint in tiles for a facing: the right view turns it a quarter, so columns and rows swap. */
export function footprintFor(item, facing = 'default') {
  const [cols, rows] = item?.footprint ?? item?.footprintTiles ?? [1, 1];
  return facing === 'right' ? [rows, cols] : [cols, rows];
}
