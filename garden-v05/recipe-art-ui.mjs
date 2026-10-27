import { el, itemDisplayName, visualItemIcon } from './ui-utils.mjs?v=24.9.83';

// Keep each recipe illustration while marking its canonical output at a glance.
export function makeRecipeIcon(recipe, items, size = 40, labels = {}) {
  const outputSize = Math.max(14, Math.round(size * 0.52));
  const name = labels?.[recipe.output] || itemDisplayName(recipe.output, recipe.label);
  const wrap = el('span', { class: 'recipe-choice-art', 'aria-label': `Thành phẩm ${name}` });
  wrap.append(
    visualItemIcon(items, `recipe_${recipe.id}`, { size }),
    el('span', { class: 'recipe-choice-output' }, visualItemIcon(items, recipe.output, { size: outputSize, kind: 'output' })),
  );
  return wrap;
}
