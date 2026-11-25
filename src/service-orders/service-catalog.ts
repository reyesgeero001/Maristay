import { ServiceType } from '../common/enums';

export interface CatalogItem {
  name: string;
  serviceType: ServiceType;
  /** Price in PHP per unit. 0 = complimentary. */
  unitPrice: number;
}

/**
 * Server-side price list for service orders.
 * Clients send only an itemCode and quantity; the price is always taken from
 * here, so a guest can never set their own price. To change prices, edit this
 * table (a future version could move it into a database table).
 */
export const SERVICE_CATALOG: Record<string, CatalogItem> = {
  BREAKFAST_SET: { name: 'Filipino breakfast set', serviceType: ServiceType.FOOD, unitPrice: 450 },
  CLUB_SANDWICH: { name: 'Club sandwich with fries', serviceType: ServiceType.FOOD, unitPrice: 380 },
  PANCIT_CANTON: { name: 'Pancit canton (good for 2)', serviceType: ServiceType.FOOD, unitPrice: 520 },
  BREWED_COFFEE: { name: 'Brewed coffee', serviceType: ServiceType.BEVERAGE, unitPrice: 120 },
  FRESH_JUICE: { name: 'Fresh mango juice', serviceType: ServiceType.BEVERAGE, unitPrice: 150 },
  BOTTLED_WATER: { name: 'Bottled water (1 L)', serviceType: ServiceType.BEVERAGE, unitPrice: 60 },
  EXTRA_TOWELS: { name: 'Extra towels (set)', serviceType: ServiceType.AMENITIES, unitPrice: 0 },
  TOILETRY_KIT: { name: 'Toiletry kit', serviceType: ServiceType.AMENITIES, unitPrice: 180 },
  EXTRA_BED: { name: 'Extra bed (per night)', serviceType: ServiceType.AMENITIES, unitPrice: 900 },
  LAUNDRY_BAG: { name: 'Laundry service (per bag)', serviceType: ServiceType.LAUNDRY, unitPrice: 350 },
  PRESSING: { name: 'Pressing (per piece)', serviceType: ServiceType.LAUNDRY, unitPrice: 80 },
  AIRPORT_TRANSFER: { name: 'Airport transfer', serviceType: ServiceType.OTHER, unitPrice: 1200 },
  ROOM_REFRESH: { name: 'Mid-stay room refresh', serviceType: ServiceType.OTHER, unitPrice: 0 },
};

export const SERVICE_ITEM_CODES = Object.keys(SERVICE_CATALOG);
