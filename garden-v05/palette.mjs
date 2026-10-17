// The only colours the garden may draw with (docs/art-bible.md, section 3).
// SPRITE_PALETTE is the authored sprite set shared by every asset manifest;
// SCENE_EXTENSION covers terrain, snow and magic effects the sprites never needed.
// palette.test.mjs fails if any runtime module uses a hex colour outside PALETTE.
export const SPRITE_PALETTE = Object.freeze([
  '#231F2E', '#4A3042', '#735044', '#A57554', // gỗ · da · bóng tối
  '#41465C', '#687486', '#A6B1AE', '#D6D8BF', // đá · kim loại · kem
  '#24483F', '#3F6A45', '#71934B', '#B0BD67', // cỏ · lá
  '#8B4A3F', '#C97952', '#E7AE73', '#F5D69A', // đất · ánh ấm
  '#874056', '#C75B4B', '#ED8A45', '#FFC36B', // lửa · bí ngô
  '#3E3B70', '#6961A6', '#70A8B6', '#B7DEE0', // phép · đêm · nước
]);

export const SCENE_EXTENSION = Object.freeze([
  '#142620', // rừng đêm sâu
  '#4A3C2C', // nâu đất trung tính
  '#5D6046', '#777044', // ô liu tối · ô liu
  '#B49A66', // đá lối đi · rơm
  '#E8F0ED', // tuyết · điểm sáng trắng
  '#B378FF', // phép tím sáng
  '#E07A9E', // hồng: tim, hoa
]);

export const PALETTE = Object.freeze([...SPRITE_PALETTE, ...SCENE_EXTENSION]);
