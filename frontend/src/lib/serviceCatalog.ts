/**
 * Display copy of the backend's service catalog (src/service-orders/service-catalog.ts).
 * The API has no catalog endpoint, so item codes and listed prices are mirrored
 * here for the order form only. The client sends just itemCode + quantity —
 * the server always applies its own price, and the saved order shows it.
 */
export const SERVICE_ITEMS: { code: string; name: string; type: string; price: number }[] = [
  { code: 'BREAKFAST_SET', name: 'Filipino breakfast set', type: 'Food', price: 450 },
  { code: 'CLUB_SANDWICH', name: 'Club sandwich with fries', type: 'Food', price: 380 },
  { code: 'PANCIT_CANTON', name: 'Pancit canton (good for 2)', type: 'Food', price: 520 },
  { code: 'BREWED_COFFEE', name: 'Brewed coffee', type: 'Beverage', price: 120 },
  { code: 'FRESH_JUICE', name: 'Fresh mango juice', type: 'Beverage', price: 150 },
  { code: 'BOTTLED_WATER', name: 'Bottled water (1 L)', type: 'Beverage', price: 60 },
  { code: 'EXTRA_TOWELS', name: 'Extra towels (set)', type: 'Amenities', price: 0 },
  { code: 'TOILETRY_KIT', name: 'Toiletry kit', type: 'Amenities', price: 180 },
  { code: 'EXTRA_BED', name: 'Extra bed (per night)', type: 'Amenities', price: 900 },
  { code: 'LAUNDRY_BAG', name: 'Laundry service (per bag)', type: 'Laundry', price: 350 },
  { code: 'PRESSING', name: 'Pressing (per piece)', type: 'Laundry', price: 80 },
  { code: 'AIRPORT_TRANSFER', name: 'Airport transfer', type: 'Other', price: 1200 },
  { code: 'ROOM_REFRESH', name: 'Mid-stay room refresh', type: 'Other', price: 0 },
];

export const itemName = (code: string) => SERVICE_ITEMS.find((i) => i.code === code)?.name ?? code;
