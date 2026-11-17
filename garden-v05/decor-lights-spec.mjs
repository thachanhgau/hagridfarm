// Explicit reviewed emitters: holiday evergreens, lamps/candles and fixed scene lamps.
// Ordinary forest pines and unlit foliage do not emit light.
export const DECOR_LIGHTS=Object.freeze(Object.fromEntries([
 ['sp_xmas_weasley_tree','tree'],['ev_champion_tree','tree'],['nx_dobby_sock_tree','tree'],['nx_chocolate_frog_tree','tree'],['nx_hagrid_boot_planter','tree'],['nx_bowtruckle_fir_perch','tree'],['nx_snitch_wreath','tree'],['nx_serpent_holly_urn','tree'],
 ...['decor_pumpkin_lantern','decor_floating_candles','hw_cloth_ghost_lantern','hw_bat_lantern','hw_skull_lantern','hw_haunted_house_lantern','hw_spider_light_garland','hw_lantern_ancient_tree','nx_mooncalf_moon_lantern','nx_phoenix_candle_bough','nx_norbert_egg_lantern','nx_snitch_lamp_post','nx_great_hall_candle_cluster','nh_slytherin_lake_lantern_buoy'].map(id=>[id,'lamp']),
 ...['nw_gnome_lantern','nw_elf_lantern','nw_hogwarts_candles','nw_pinecone_lantern','nw_moon_lantern','nw_star_lantern','nw_candle_wreath','nw_owl_lantern','nw_acorn_lantern'].map(id=>[id,'lamp']),
 ...['nw_fir_spiral','nw_fir_bells','nw_fir_nest','nw_fir_stars'].map(id=>[id,'tree']),
 ['hero-yule','tree'],['scene_moon_lantern','lamp'],['decoration-35','lamp'],['decoration-71','lamp'],['hut','scene'],['pond-nook','scene'],
].map(([id,kind])=>[id,{kind,maxPoints:kind==='tree'?10:kind==='scene'?3:6}])));
