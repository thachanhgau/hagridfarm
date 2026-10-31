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

// [id, label, level, price, footprint [long, short] in tiles, book, chapter, short lore, festival it is sold in]
// Owner 20/10/2026: Halloween pieces sell only during the Halloween festival (event_halloween, 24/10–06/11),
// to every member whatever their level, at a higher price; owned ones stay after the season.
const ROWS = [
  ['sp_sorting_hat', 'Nón Phân Loại trên ghế', 25, 1400, [1, 1], 1, 7, 'Nón Phân Loại đặt trên ghế trong lễ phân loại.'],
  ['sp_monster_book', 'Sách Quái Vật về Quái Vật', 25, 1400, [1, 1], 3, 1, 'Cuốn sách Hagrid gửi tặng Harry cho môn Chăm Sóc Sinh Vật Huyền Bí.'],
  ['sp_hagrid_umbrella', 'Góc ô hồng của Hagrid', 25, 2200, [2, 1], 1, 4, 'Chiếc ô hồng của Hagrid.'],
  ['sp_deluminator', 'Cái Tắt-Sáng', 28, 1500, [1, 1], 7, 7, 'Dumbledore để lại dụng cụ thu ánh sáng cho Ron.'],
  ['sp_deathday_cake', 'Bánh ngày giỗ Nick Suýt Mất Đầu', 1, 4000, [2, 1], 2, 8, 'Bánh hình bia mộ trong tiệc ngày giỗ thứ 500 của Nick.', 'event_halloween'],
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

export const SEASON_LABELS = Object.freeze({event_halloween: 'Lễ Hội Ma'});

export const SPECIAL_PRODUCTS = Object.freeze(ROWS.map(([id, label, level, price, footprint, book, chapter, lore, season]) => Object.freeze({
  id, kind: 'decoration', collection: SPECIAL_COLLECTION, decorationId: id, icon: id, label, level, price, quantity: 1, dailyLimit: 1,
  footprint: Object.freeze(footprint), book, chapter, lore, ...(season ? {season} : {}),
  description: `${lore} (${BOOK_TITLES[book]} · chương ${chapter}) · Sản phẩm đặc biệt, chỉ để trang trí.${season ? ` Chỉ bán trong ${SEASON_LABELS[season]}.` : ''}`,
})));

// «Cửa hàng lễ hội»: festival decorations (art: halloween-assets/manifest.json), sold only in their festival, at any
// level. Owner 20/10/2026 («nhập vô đi») on the proposed prices. Decoration only. Server copy: garden-wallet-catalog.js.
export const FESTIVAL_COLLECTION = 'festival';
// [id, label, price, footprint, short description, festival]
// Owner directly approved the 90,400 G table and opening sales in this chat (24/10/2026).
const HALLOWEEN_NEW_PRICES_APPROVED = true;
const FESTIVAL_ROWS = [
  ['hw_halloween_sign', 'Biển gỗ Halloween', 1800, [1, 1], 'Tấm biển gỗ treo đèn bí ngô, chỉ lối vào đêm hội.', 'event_halloween'],
  ['hw_wooden_black_cat', 'Tượng mèo đen bằng gỗ', 2000, [1, 1], 'Chú mèo đen tạc gỗ với đôi mắt vàng.', 'event_halloween'],
  ['hw_cloth_ghost_lantern', 'Đèn ma vải', 2200, [1, 1], 'Con ma vải treo trên cần gỗ.', 'event_halloween'],
  ['hw_pumpkin_stack', 'Chồng bí ngô khắc mặt', 2400, [1, 1], 'Ba quả bí ngô khắc mặt chồng lên nhau, quả trên đội mũ phù thủy.', 'event_halloween'],
  ['hw_monster_candy_barrel', 'Thùng kẹo quái vật', 2400, [1, 1], 'Thùng gỗ đầy kẹo, nắp há miệng như quái vật.', 'event_halloween'],
  ["hw_dead_bat_tree","Cây khô treo dơi",3400,[2,1],"Cây khô với đàn dơi nhỏ giữa những nhánh cong.","event_halloween"],
  ["hw_bat_lantern","Đèn lồng dơi",2200,[1,1],"Đèn lồng tạo hình dơi, ánh nến ấm trong lồng.","event_halloween"],
  ["hw_skull_lantern","Đèn đầu lâu",2200,[1,1],"Đèn đầu lâu trên trụ gỗ.","event_halloween"],
  ["hw_haunted_house_lantern","Đèn lồng hình nhà ma",2600,[1,1],"Ngôi nhà ma thu nhỏ với cửa sổ ánh vàng.","event_halloween"],
  ["hw_ghost_orb","Quả cầu ma nhỏ",2400,[1,1],"Quả cầu kính với bóng ma nhỏ bên trong.","event_halloween"],
  ["hw_spider_light_garland","Giàn đèn nhện",3600,[2,1],"Giàn dây treo đèn hình nhện.","event_halloween"],
  ["hw_soul_bottle","Bình linh hồn phát sáng",2400,[1,1],"Chiếc bình chứa ánh sáng linh hồn.","event_halloween"],
  ["hw_candy_cauldron","Vạc kẹo sôi",2400,[1,1],"Vạc lớn chứa kẹo cho đêm hội.","event_halloween"],
  ["hw_halloween_potion_table","Bàn pha độc dược Halloween",3800,[2,1],"Bàn gỗ bày chai độc dược, sách và nến Halloween.","event_halloween"],
  ["hw_monster_bookcase","Tủ sách há miệng",3600,[2,1],"Tủ sách hình quái vật với miệng răng nhọn.","event_halloween"],
  ["hw_blinking_chest","Rương nháy mắt",3400,[2,1],"Rương gỗ với đôi mắt quái vật trên nắp.","event_halloween"],
  ["hw_witch_hat_rack","Giá treo mũ phù thủy",2400,[1,1],"Giá gỗ treo những chiếc mũ phù thủy.","event_halloween"],
  ["hw_caramel_apple_cart","Xe đẩy táo bọc kẹo",4000,[2,1],"Xe gỗ bày táo bọc kẹo và mái sọc.","event_halloween"],
  ["hw_grinning_stump","Gốc cây mặt quỷ",3400,[2,1],"Gốc cây có khuôn mặt quỷ và rễ uốn cong.","event_halloween"],
  ["hw_skull_mushrooms","Cụm nấm hình đầu lâu",2000,[1,1],"Cụm nấm nhợt màu tạo hình đầu lâu.","event_halloween"],
  ["hw_eyeball_flowers","Bụi hoa mắt tròn",2200,[1,1],"Bụi hoa có những con mắt tròn nhiều màu.","event_halloween"],
  ["hw_owl_tree_hollow","Hốc cây có cú đêm",2600,[1,1],"Hốc cây nhỏ làm chỗ đậu cho cú đêm.","event_halloween"],
  ["hw_dewy_cobweb_frame","Giàn mạng nhện đọng sương",3600,[2,1],"Khung gỗ phủ mạng nhện và những giọt sương.","event_halloween"],
  ["hw_pumpkin_spider_nest","Tổ nhện trong bí ngô",2400,[1,1],"Bí ngô với tổ nhện bên trong.","event_halloween"],
  ["hw_root_halloween_gate","Cổng Halloween bằng rễ cây",5400,[3,1],"Cổng vòm bằng rễ cây, bí ngô và đèn treo.","event_halloween"],
  ["hw_crooked_witch_hut","Lều phù thủy mái vẹo",5800,[2,2],"Lều phù thủy nhỏ với mái vẹo và cửa sổ ấm.","event_halloween"],
  ["hw_mini_pumpkin_house","Nhà bí ngô thu nhỏ",5600,[2,2],"Ngôi nhà bí ngô với cửa ra vào nhỏ.","event_halloween"],
  ["hw_ghost_well","Giếng có ma ló đầu",5200,[2,2],"Giếng đá có bóng ma nhìn qua miệng giếng.","event_halloween"],
  ["hw_violet_mist_pond","Ao sương tím",6600,[3,2],"Ao nhỏ với sắc tím và những tảng đá quanh bờ.","event_halloween"],
  ["hw_lantern_ancient_tree","Cây cổ thụ treo đèn",7200,[3,2],"Cây cổ thụ tán thu với những chiếc đèn treo.","event_halloween"],
];
export const FESTIVAL_PRODUCTS = Object.freeze(FESTIVAL_ROWS.map(([id, label, price, footprint, lore, season], index) => Object.freeze({
  id, kind: 'decoration', collection: FESTIVAL_COLLECTION, decorationId: id, icon: id, label, level: 1, price, quantity: 1, dailyLimit: 1,
  footprint: Object.freeze(footprint), lore, season,
  ...(index >= 5 && !HALLOWEEN_NEW_PRICES_APPROVED ? {forSale: false} : {}),
  description: `${lore} · Đồ lễ hội, chỉ để trang trí. Chỉ bán trong ${SEASON_LABELS[season]}.`,
})));

// «Mừng HPVN 3 tháng» (owner 31/10/2026): the event's gift, never sold and not listed in the store.
// Same rows as the server (functions/games/garden-wallet-catalog.js EVENT_ROWS).
export const EVENT_COLLECTION = 'event';
const EVENT_ROWS = [
  ['ev_dobby_spring_rider', 'Tượng Dobby cưỡi thú nhún', [2,2], 'Dobby cưỡi chú Bằng-Mã nhún lò xo, quà Hội Gia Tinh mừng HPVN 3 tháng.'],
  ['ev_dark_dobby_red', 'Tượng Dobby Hắc Ám', [2,2], 'Dobby tạc đá đỏ, giơ chiếc tất, quà Hội Gia Tinh mừng HPVN 3 tháng.'],
];
export const EVENT_PRODUCTS = Object.freeze(EVENT_ROWS.map(([id, label, footprint, lore]) => Object.freeze({
  id, kind: 'decoration', collection: EVENT_COLLECTION, decorationId: id, icon: id, label, level: 1, price: 1, quantity: 1, dailyLimit: 1, // catalog shape only: `reward` refuses every purchase
  footprint: Object.freeze(footprint), lore, forSale: false, reward: true,
  description: `${lore} · Quà sự kiện, chỉ để trang trí.`,
})));

/** Footprint in tiles for a facing: the right view turns it a quarter, so columns and rows swap. */
export function footprintFor(item, facing = 'default') {
  const [cols, rows] = item?.footprint ?? item?.footprintTiles ?? [1, 1];
  return facing === 'right' ? [rows, cols] : [cols, rows];
}
