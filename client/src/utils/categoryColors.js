export const CATEGORY_COLORS = {
  Kitchen:       '#F97316',
  Office:        '#3B82F6',
  Technology:    '#8B5CF6',
  Electronics:   '#8B5CF6',
  Furniture:     '#10B981',
  Nature:        '#22C55E',
  Animal:        '#EAB308',
  Vehicle:       '#06B6D4',
  Sport:         '#EF4444',
  Clothing:      '#EC4899',
  Food:          '#F59E0B',
  Outdoor:       '#64748B',
  Person:        '#6366F1',
  Education:     '#0EA5E9',
  Medical:       '#F43F5E',
  Entertainment: '#D946EF',
  Beauty:        '#F472B6',
  Tools:         '#78716C',
  Accessories:   '#14B8A6',
  Gadgets:       '#A855F7',
  Household:     '#B45309',
  General:       '#94A3B8'
};

export function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.General;
  
  // Xử lý không phân biệt chữ hoa chữ thường
  const key = Object.keys(CATEGORY_COLORS).find(
    k => k.toLowerCase() === category.toLowerCase()
  );
  
  return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS.General;
}
