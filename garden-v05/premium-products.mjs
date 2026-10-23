// Level-500 roadmap P4 (§10): the premium store. Mirror of HPVN functions/games/garden-premium-core.js
// (PREMIUM_ITEMS, saleTotal); the HPVN catalog test compares the two. The server prices every purchase.
const ROWS = [
 ["spring_rain","rain","Mưa suối thần",50,6300,10,1,"Cả vườn chín và được gặt ngay. Giá cố định, không tính theo số thửa. Dùng 1 lần mỗi ngày, từ cấp 101 được 2 lần."],
 ["felix_felicis","felix","Phúc Lạc Dược",40,3000,10,1,"XP ×1,5 trong 2 giờ; phần thưởng thêm tối đa bằng nửa XP cần của cấp lúc uống. Không nhân XP từ suối thần. 1 lọ mỗi ngày."],
 ["prime_meal","primeMeal","Bữa ăn thượng hạng",10,120,150,30,"Một sinh vật đang ăn xong bữa ngay. Dùng tối đa 30 phần mỗi ngày."],
 ["pen_feast","feast","Tiệc chuồng",26,900,30,3,"Mọi sinh vật đang ăn xong bữa ngay. Dùng tối đa 3 lần mỗi ngày."],
 ["skele_gro","skeleGro","Thuốc Mọc Xương",18,400,60,3,"Tính thêm 3 bữa vào đường trưởng thành của một sinh vật chưa lớn (không cho sản vật). Tối đa 3 chai mỗi sinh vật mỗi ngày."],
];
const NEST_LEVELS = [10,22,38,54,70,86];
export const PREMIUM_PRODUCTS = Object.freeze([
 ...ROWS.map(([id,supply,label,level,price,stockCap,usesPerDay,description])=>Object.freeze({id,kind:"premium",supply,icon:id,label,level,price,quantity:1,dailyLimit:1000,stockCap,usesPerDay,bundles:true,description})),
 ...NEST_LEVELS.map((level,i)=>Object.freeze({id:`warm_nest_${i+1}`,kind:"nest",pen:i+1,icon:"warm_nest",label:`Ổ ấm chuồng ${i+1}`,level,price:5000+2000*i,quantity:1,dailyLimit:1,
  description:`Lót ổ cho chuồng thứ ${i+1}: hai sinh vật ở đó ăn nhanh hơn 20% mãi mãi. Mua một lần.`})),
]);
// Gói mua nhiều: ×5 −10%, ×10 −20%, ×30 −30%; any quantity takes the largest tier it reaches. Sale + bundle ≤ 50%.
export const BUNDLE_SIZES = Object.freeze([1,5,10,30]);
export const bundlePercent = n => n>=30?30:n>=10?20:n>=5?10:0;
export const saleTotal = (item,n) => {
 const percent=Math.min(50,(item.sale?.percent||0)+(item.bundles?bundlePercent(n):0));
 return Math.max(1,Math.round(item.price*n*(100-percent)/100));
};
// Text for a sale's real end time («còn 25 phút», «đến 22:00»). Never a fake «sắp hết» (roadmap §10.3).
export function saleLeft(sale,now=Date.now()){
 const left=Math.max(0,sale.endsAt-now),m=Math.ceil(left/60000);
 if(m<=90)return `còn ${m} phút`;
 const d=new Date(sale.endsAt+7*3600000);
 return `đến ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}${left>86400000?` ${d.getUTCDate()}/${d.getUTCMonth()+1}`:""}`;
}
