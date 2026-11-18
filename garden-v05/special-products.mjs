import {SOFT_WINTER_ROWS} from './soft-winter-products.mjs?v=26.20';
// «Sản phẩm đặc biệt»: 30 decorations from the books (art and lore: special-products-assets/manifest.json,
// runtime sprites in decor-assets-manifest.json). Decoration only: no XP, yield, power or reward.
// Owner 04/11/2026 (big update 25.0 S1): on sale at the §3 prices (garden-store-catalog storePrice); the HPVN server
// decides `forSale`. Server copy: HPVNN functions/games/garden-wallet-catalog.js (a parity test compares both).
export const SPECIAL_COLLECTION = 'special';
export const SPECIAL_PRICES_APPROVED = true;

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
  ['sp_hagrid_umbrella', 'Góc dù hồng của Hagrid', 25, 2200, [2, 1], 1, 4, 'Cây dù hồng của Hagrid.'],
  ['sp_deluminator', 'Cái Tắt-Sáng', 28, 1500, [1, 1], 7, 7, 'Dumbledore để lại dụng cụ thu ánh sáng cho Ron.'],
  ['sp_deathday_cake', 'Bánh ngày giỗ Nick Suýt Mất Đầu', 1, 4000, [2, 1], 2, 8, 'Bánh hình bia mộ trong tiệc ngày giỗ thứ 500 của Nick.', 'event_halloween'],
  ['sp_time_turner', 'Cái Xoay Thời Gian', 32, 1800, [1, 1], 3, 21, 'Dụng cụ Hermione dùng cùng Harry để quay lại thời gian.'],
  ['sp_hand_glory', 'Bàn Tay Vẻ Vang', 34, 1600, [1, 1], 2, 4, 'Cổ vật trong tiệm Borgin và Burkes.'],
  ['sp_marauders_map', 'Bản đồ của Đạo tặc', 35, 2700, [2, 1], 3, 10, 'Fred và George trao cho Harry bản đồ các lối đi bí mật.'],
  ['sp_cursed_opal_necklace', 'Chuỗi ngọc bị nguyền', 36, 1800, [1, 1], 6, 12, 'Chuỗi ngọc khiến Katie Bell bị nguyền.'],
  ['sp_goblet_fire', 'Chiếc Cốc Lửa', 38, 2100, [1, 1], 4, 16, 'Chiếc cốc gỗ chọn các quán quân Tam Pháp Thuật.'],
  ['sp_riddle_diary', 'Nhật ký Riddle và nanh Tử Xà', 40, 2200, [1, 1], 2, 17, 'Harry dùng nanh Tử Xà phá hủy quyển nhật ký.'],
  ['sp_wizard_chess_knight', 'Quân cờ hiệp sĩ', 40, 3000, [2, 1], 1, 16, 'Bàn cờ phù thủy khổng lồ bảo vệ Hòn Đá Phù Thủy.'],
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
  ['sp_snitch_resurrection_stone', 'Snitch giữ viên đá Phục sinh', 64, 3900, [2, 1], 7, 34, 'Harry mở trái Snitch trước khi vào Rừng Cấm.'],
  ['sp_aragog_hollow', 'Hang tơ Aragog', 66, 5700, [2, 2], 2, 15, 'Aragog và bầy nhện trong Rừng Cấm.'],
  ['sp_sirius_motorbike', 'Xe máy bay của Sirius', 70, 6000, [3, 1], 1, 1, 'Chiếc xe máy Hagrid dùng đưa Harry tới đường Privet.'],
  ['sp_department_veil', 'Vòm màn che ở Bộ Pháp Thuật', 74, 6300, [2, 2], 5, 34, 'Vòm đá có màn che trong Sở Bảo Mật.'],
  ['sp_chamber_serpent_door', 'Cánh cửa Phòng Chứa Bí Mật', 78, 6800, [3, 1], 2, 16, 'Vách đá hai con rắn, mở bằng Xà Ngữ.'],
  ['sp_knight_bus', 'Xe Đò Hiệp Sĩ', 84, 7800, [3, 1], 3, 3, 'Chiếc xe buýt ba tầng đón Harry rời nhà Dursley.'],
  ['sp_whomping_anglia', 'Liễu Roi và chiếc Ford Anglia', 90, 9000, [3, 2], 2, 5, 'Harry và Ron đâm xe vào cây Liễu Roi.'],
  // Big update 25.0 S7: the Noel set of the bậc Tận Sức (level-500 P3), sold all December (season 'xmas'). Server copy alike.
  ['sp_xmas_firebolt', 'Cây chổi Tia Chớp quà Giáng sinh', 120, 3300, [1, 1], 3, 11, 'Món quà Giáng sinh không đề tên: một cây chổi Tia Chớp.', 'xmas'],
  ['sp_xmas_butterbeer', 'Quầy bia bơ quán Ba Cây Chổi', 160, 4200, [2, 1], 3, 10, 'Những vại bia bơ nóng trong quán Ba Cây Chổi ngày tuyết rơi ở làng Hogsmeade.', 'xmas'],
  ['sp_xmas_honeydukes', 'Tủ kẹo tiệm Công tước Mật', 200, 4500, [2, 1], 3, 10, 'Tiệm kẹo Công tước Mật ở làng Hogsmeade, chỗ Ron mơ được vô.', 'xmas'],
  ['sp_xmas_invisibility_cloak', 'Áo khoác tàng hình trong gói quà', 260, 3900, [1, 1], 1, 12, 'Gói quà Giáng sinh kèm mảnh giấy: «Chúc con một Giáng sinh vui vẻ».', 'xmas'],
  ['sp_xmas_weasley_tree', 'Cây thông Giáng sinh nhà Weasley', 350, 6300, [2, 2], 6, 16, 'Thiên thần trên ngọn cây thông thực ra là một con ma lùm.', 'xmas'],
  ['sp_xmas_yule_roses', 'Vườn hồng đêm Dạ vũ', 450, 9000, [3, 2], 4, 23, 'Những nàng tiên ngồi trong bụi hoa hồng, quanh tượng ông già Noel và cỗ xe tuần lộc.', 'xmas'],
];

export const SEASON_LABELS = Object.freeze({event_halloween: 'Lễ Hội Ma', xmas: 'mùa Giáng sinh (tới 31/12)'});

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
  ['hw_pumpkin_stack', 'Chồng bí ngô khắc mặt', 2400, [1, 1], 'Ba quả bí ngô khắc mặt chồng lên nhau, quả trên đội nón phù thủy.', 'event_halloween'],
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
  ["hw_witch_hat_rack","Giá treo nón phù thủy",2400,[1,1],"Giá gỗ treo những chiếc nón phù thủy.","event_halloween"],
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
  // 50 new Christmas garden decorations (2026-11-15); season and ownership follow existing festival rules.
  ["nx_snitch_wreath", "Vòng lá thông Snitch", 1800, [1, 1], "Vòng lá thông Snitch dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_elf_yule_tent", "Lều Noel của gia tinh", 5400, [2, 2], "Lều vải vá từ áo gối cũ, cửa thấp, dây vớ len và đèn lồng ấm cho gia tinh đón Noel.", "xmas"],
  ["nx_owl_parcel_roost", "Trạm cú phát quà", 3600, [2, 1], "Trạm cú phát quà dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_hagrid_boot_planter", "Ủng Hagrid trồng thông", 2000, [1, 1], "Ủng Hagrid trồng thông dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_fang_biscuit_kennel", "Nhà Noel của Fang", 4200, [2, 1], "Nhà Noel của Fang dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_niffler_coin_snowglobe", "Quả cầu tuyết Đào mỏ", 2400, [1, 1], "Quả cầu tuyết Đào mỏ dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_bowtruckle_fir_perch", "Giàn thông Que Xạo", 2200, [1, 1], "Giàn thông Que Xạo dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_mooncalf_moon_lantern", "Đèn trăng Mooncalf", 2400, [1, 1], "Đèn trăng Mooncalf dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_puffskein_sock_basket", "Giỏ vớ Quái lùng nhùng", 2200, [1, 1], "Giỏ vớ Quái lùng nhùng dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_hippogriff_gift_sleigh", "Xe quà Bằng-Mã", 5600, [3, 1], "Xe quà Bằng-Mã dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_unicorn_ice_fountain", "Đài băng kỳ lân", 6600, [2, 2], "Đài băng kỳ lân dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_thestral_silver_bell", "Chuông bạc Vong mã", 2400, [1, 1], "Chuông bạc Vong mã dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_fwooper_music_box", "Hộp nhạc Fwooper", 2600, [1, 1], "Hộp nhạc Fwooper dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_phoenix_candle_bough", "Cành nến phượng hoàng", 3800, [2, 1], "Cành nến phượng hoàng dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_norbert_egg_lantern", "Đèn trứng rồng Noel", 2600, [1, 1], "Đèn trứng rồng Noel dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_snowwizard_hat", "Người tuyết đội nón phù thủy", 2400, [1, 1], "Người tuyết đội nón phù thủy dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_snow_owl_sculpture", "Tượng cú tuyết mùa đông", 2200, [1, 1], "Tượng cú tuyết mùa đông dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_snow_dragon_sculpture", "Rồng tuyết giữ quà", 4000, [2, 1], "Rồng tuyết giữ quà dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_snow_hogwarts_castle", "Lâu đài tuyết phép thuật", 7200, [3, 2], "Lâu đài tuyết phép thuật dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_ice_wand_star", "Ngôi sao băng đũa phép", 2200, [1, 1], "Ngôi sao băng đũa phép dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_mistletoe_gate", "Cổng tầm gửi Giáng sinh", 5600, [3, 1], "Cổng tầm gửi Giáng sinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_holly_broom_fence", "Hàng rào chổi lá nhựa ruồi", 4400, [3, 1], "Hàng rào chổi lá nhựa ruồi dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_snitch_lamp_post", "Cột đèn Snitch", 2600, [1, 1], "Cột đèn Snitch dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_floo_chimney_mailbox", "Hộp thư ống khói Noel", 2400, [1, 1], "Hộp thư ống khói Noel dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_hogwarts_express_parcels", "Xe hành lý tốc hành Noel", 3800, [2, 1], "Xe hành lý tốc hành Noel dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_platform_clock", "Đồng hồ sân ga mùa tuyết", 2800, [1, 1], "Đồng hồ sân ga mùa tuyết dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_enchanted_cracker_table", "Bàn pháo giấy phù thủy", 3600, [2, 1], "Bàn pháo giấy phù thủy dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_wizard_chess_christmas", "Bàn cờ đêm Giáng sinh", 4000, [2, 1], "Bàn cờ đêm Giáng sinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_weasley_knit_rack", "Giá áo len nhà Weasley", 3600, [2, 1], "Giá áo len nhà Weasley dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_dobby_sock_tree", "Cây vớ tặng gia tinh", 4000, [2, 1], "Cây vớ tặng gia tinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_mince_pie_cart", "Xe bánh Giáng sinh", 4000, [2, 1], "Xe bánh Giáng sinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_plum_pudding_stand", "Bánh pudding lửa phép", 2400, [1, 1], "Bánh pudding lửa phép dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_chocolate_frog_tree", "Tháp quà Kẹo Ếch", 2600, [1, 1], "Tháp quà Kẹo Ếch dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_peppermint_cauldron", "Vạc cacao bạc hà", 2600, [1, 1], "Vạc cacao bạc hà dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_butterbeer_barrel_seat", "Ghế thùng bia bơ mùa đông", 2200, [1, 1], "Ghế thùng bia bơ mùa đông dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_gingerbread_hagrids_hut", "Nhà bánh gừng của Hagrid", 4200, [2, 1], "Nhà bánh gừng của Hagrid dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_gingerbread_greenhouse", "Nhà kính bánh gừng", 4200, [2, 1], "Nhà kính bánh gừng dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_mandrake_earmuff_planter", "Chậu Nhân sâm đón Noel", 2600, [1, 1], "Chậu Nhân sâm đón Noel dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_frosted_dittany_bed", "Bồn Bạch tiên mùa tuyết", 3400, [2, 1], "Bồn Bạch tiên mùa tuyết dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_glowing_mistletoe_pot", "Chậu tầm gửi ánh sao", 2200, [1, 1], "Chậu tầm gửi ánh sao dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_fairy_pine_log", "Khúc gỗ tiên Giáng sinh", 3800, [2, 1], "Khúc gỗ tiên Giáng sinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_icicle_harp", "Đàn hạc băng Dạ vũ", 4400, [2, 1], "Đàn hạc băng Dạ vũ dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_yule_dance_gazebo", "Chòi Dạ vũ mùa đông", 7600, [3, 2], "Chòi Dạ vũ mùa đông dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_enchanted_violin_stand", "Đàn vĩ cầm tự chơi", 3000, [1, 1], "Đàn vĩ cầm tự chơi dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_great_hall_candle_cluster", "Cụm nến Đại Sảnh mùa lễ", 4000, [2, 1], "Cụm nến Đại Sảnh mùa lễ dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_raven_ice_bench", "Ghế đá quạ mùa đông", 3600, [2, 1], "Ghế đá quạ mùa đông dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_lion_firewood_rack", "Giá củi sư tử Giáng sinh", 3400, [2, 1], "Giá củi sư tử Giáng sinh dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_badger_cookie_table", "Bàn bánh lửng mật", 3600, [2, 1], "Bàn bánh lửng mật dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_serpent_holly_urn", "Bình lá thông rắn bạc", 2800, [1, 1], "Bình lá thông rắn bạc dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],
  ["nx_hagrid_gift_crate", "Rương quà bác Hagrid", 3800, [2, 1], "Rương quà bác Hagrid dành cho khu vườn Giáng sinh của phù thủy.", "xmas"],

  ["nh_gryffindor_lion_snow_guard", "Sư tử tuyết giữ quà", 3600, [2, 1], "Sư tử tuyết giữ quà trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_sword_holly_gate", "Cổng kiếm lá nhựa ruồi", 5200, [3, 1], "Cổng kiếm lá nhựa ruồi trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_commonroom_hearth", "Lò sưởi sư tử đêm Noel", 6200, [2, 2], "Lò sưởi sư tử đêm Noel trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_quidditch_crate", "Rương Quidditch đỏ thắm", 3800, [2, 1], "Rương Quidditch đỏ thắm trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_courage_watchtower", "Tháp canh Lòng Dũng Cảm", 6800, [2, 2], "Tháp canh Lòng Dũng Cảm trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_rocking_lion", "Sư tử gỗ ngựa bập bênh", 4200, [2, 1], "Sư tử gỗ ngựa bập bênh trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_scarlet_feast_table", "Bàn tiệc đỏ vàng Gryffindor", 4400, [2, 1], "Bàn tiệc đỏ vàng Gryffindor trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_flame_bell_stand", "Giá chuông ngọn lửa vàng", 2800, [1, 1], "Giá chuông ngọn lửa vàng trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_cracker_sled", "Xe trượt quà pháo giấy", 5600, [3, 1], "Xe trượt quà pháo giấy trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_gryffindor_lion_paw_brazier", "Lò than chân sư tử", 3000, [1, 1], "Lò than chân sư tử trong bộ Noel nhà Gryffindor.", "xmas", "gryffindor"],
  ["nh_slytherin_serpent_ice_arch", "Cổng băng rắn bạc", 5400, [3, 1], "Cổng băng rắn bạc trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_emerald_orangery", "Nhà kính lục bảo mùa đông", 7000, [2, 2], "Nhà kính lục bảo mùa đông trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_winter_potion_bar", "Quầy thức uống lục bảo", 4600, [2, 1], "Quầy thức uống lục bảo trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_frozen_serpent_fountain", "Đài phun rắn đóng băng", 6800, [2, 2], "Đài phun rắn đóng băng trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_lake_lantern_buoy", "Đèn phao Hồ Đen", 3000, [1, 1], "Đèn phao Hồ Đen trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_silver_chess_dais", "Bục cờ rắn bạc", 4400, [2, 1], "Bục cờ rắn bạc trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_serpent_sleigh", "Xe trượt rắn lục bạc", 5800, [3, 1], "Xe trượt rắn lục bạc trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_holly_obelisk", "Trụ nhựa ruồi lục bạc", 2800, [1, 1], "Trụ nhựa ruồi lục bạc trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_strategy_desk", "Bàn chiến lược mùa tuyết", 4200, [2, 1], "Bàn chiến lược mùa tuyết trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_slytherin_emerald_mirror", "Gương sương giá lục bảo", 4800, [2, 1], "Gương sương giá lục bảo trong bộ Noel nhà Slytherin.", "xmas", "slytherin"],
  ["nh_hufflepuff_badger_cookie_bakery", "Tiệm bánh lửng đón Noel", 6400, [2, 2], "Tiệm bánh lửng đón Noel trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_honeycomb_gift_cart", "Xe quà tổ ong vàng", 4200, [2, 1], "Xe quà tổ ong vàng trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_badger_log_cottage", "Nhà gỗ lửng mùa đông", 6200, [2, 2], "Nhà gỗ lửng mùa đông trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_beehive_cocoa_urn", "Ấm cacao tổ ong", 3000, [1, 1], "Ấm cacao tổ ong trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_knitting_bench", "Ghế len ấm Hufflepuff", 4000, [2, 1], "Ghế len ấm Hufflepuff trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_herb_wheelbarrow", "Xe cút kít thảo dược Noel", 3800, [2, 1], "Xe cút kít thảo dược Noel trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_badger_mail_hollow", "Hộp thư hốc cây lửng", 2800, [1, 1], "Hộp thư hốc cây lửng trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_sunflower_chimes", "Chuông gió hướng dương băng", 2800, [1, 1], "Chuông gió hướng dương băng trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_chestnut_stall", "Quầy hạt dẻ mật ong", 4400, [2, 1], "Quầy hạt dẻ mật ong trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_hufflepuff_badger_picnic", "Góc picnic lửng ngày tuyết", 5000, [2, 2], "Góc picnic lửng ngày tuyết trong bộ Noel nhà Hufflepuff.", "xmas", "hufflepuff"],
  ["nh_ravenclaw_bronze_astrolabe", "Tinh bàn đồng Ravenclaw", 3200, [1, 1], "Tinh bàn đồng Ravenclaw trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_winter_observatory", "Đài quan sát lam đồng", 7200, [2, 2], "Đài quan sát lam đồng trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_eagle_snow_perch", "Đại bàng đồng giữ sách", 4000, [2, 1], "Đại bàng đồng giữ sách trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_star_book_lectern", "Giá sách bản đồ sao", 4400, [2, 1], "Giá sách bản đồ sao trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_constellation_arch", "Vòm sao lam đồng", 5800, [3, 1], "Vòm sao lam đồng trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_riddle_cabinet", "Tủ câu đố đêm đông", 4600, [2, 1], "Tủ câu đố đêm đông trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_eagle_courier_post", "Trạm thư đại bàng Noel", 3000, [1, 1], "Trạm thư đại bàng Noel trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_telescope_sled", "Xe kính thiên văn mùa tuyết", 6200, [3, 1], "Xe kính thiên văn mùa tuyết trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_eagle_music_harp", "Đàn hạc cánh đại bàng", 4800, [2, 1], "Đàn hạc cánh đại bàng trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],
  ["nh_ravenclaw_celestial_globe", "Quả cầu thiên văn lam đồng", 3400, [1, 1], "Quả cầu thiên văn lam đồng trong bộ Noel nhà Ravenclaw.", "xmas", "ravenclaw"],

  ...SOFT_WINTER_ROWS,
];
export const FESTIVAL_PRODUCTS = Object.freeze(FESTIVAL_ROWS.map(([id, label, price, footprint, lore, season, house], index) => Object.freeze({
  id, kind: 'decoration', collection: FESTIVAL_COLLECTION, decorationId: id, icon: id, label, level: 1, price, quantity: 1, dailyLimit: 1,
  footprint: Object.freeze(footprint), lore, season, ...(house ? {house} : {}),
  ...(index >= 5 && !HALLOWEEN_NEW_PRICES_APPROVED ? {forSale: false} : {}),
  description: `${lore} · Đồ lễ hội, chỉ để trang trí. Chỉ bán trong ${SEASON_LABELS[season]}.`,
})));

// «Mừng HPVN 3 tháng» (owner 31/10/2026): the event's gift, never sold and not listed in the store.
// Same rows as the server (functions/games/garden-wallet-catalog.js EVENT_ROWS).
export const EVENT_COLLECTION = 'event';
const EVENT_ROWS = [
  ['ev_dobby_spring_rider', 'Tượng Dobby cưỡi thú nhún', [2,2], 'Dobby cưỡi chú Bằng-Mã nhún lò xo, quà Hội Vận động cho Quyền lợi Gia tinh mừng HPVN 3 tháng.'],
  ['ev_dark_dobby_red', 'Tượng Dobby Hắc Ám', [2,2], 'Dobby tạc đá đỏ, giơ chiếc vớ, quà Hội Vận động cho Quyền lợi Gia tinh mừng HPVN 3 tháng.'],
  // Big update 25.0: the gift of Giáng sinh chapter 1 «Gia tinh đón đông» (S7, ten stockings).
  ['ev_elf_tent', 'Lều gia tinh', [2,2], 'Cái lều gia tinh khâu từ áo gối cũ, treo dây vớ len, quà chương «Gia tinh đón đông».'],
  ['ev_fish_tank', 'Bể cá sáu loài', [2,2], 'Bể kính khung gỗ nuôi đủ sáu loài cá hiếm, quà hoàn thành Sổ cá.'],
  // S7 chapter 3 «Dạ Vũ Noel»: the winning house's tree (server garden-xmas-chapters settleTree).
  ['ev_champion_tree', 'Cây thông nhà vô địch', [2,2], 'Cây thông Noel của nhà thắng Dạ Vũ Noel, lấp lánh những ngôi sao vàng.'],
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
