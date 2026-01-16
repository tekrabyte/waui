import type { Product, ProductPackage, Bundle, PromoConfig } from '../types/types';

/**
 * Promo Calculator Utility
 * Handles promo validation and price calculation
 */

// Day names mapping
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Check if current day and time matches promo schedule
 */
export function isPromoActive(
  promoDays?: string[],
  promoStartTime?: string,
  promoEndTime?: string,
  promoStartDate?: string,
  promoEndDate?: string,
  currentDate?: Date
): boolean {
  const now = currentDate || new Date();
  
  // Check date range if specified
  if (promoStartDate && promoEndDate) {
    const startDate = new Date(promoStartDate);
    const endDate = new Date(promoEndDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    if (now < startDate || now > endDate) {
      return false;
    }
  }
  
  // Check day of week
  if (promoDays && promoDays.length > 0) {
    const currentDay = DAYS_OF_WEEK[now.getDay()];
    if (!promoDays.includes(currentDay)) {
      return false;
    }
  }
  
  // Check time range
  if (promoStartTime && promoEndTime) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (currentTime < promoStartTime || currentTime > promoEndTime) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate discounted price based on promo configuration
 */
export function calculatePromoPrice(
  originalPrice: number,
  promoType: 'fixed' | 'percentage',
  promoValue: number
): number {
  if (promoType === 'percentage') {
    const discount = (originalPrice * promoValue) / 100;
    return Math.max(0, originalPrice - discount);
  } else {
    // fixed amount
    return Math.max(0, originalPrice - promoValue);
  }
}

/**
 * Get the effective price for a product (considering active promo)
 */
export function getEffectivePrice(
  item: Product | ProductPackage | Bundle,
  currentDate?: Date
): { price: number; hasActivePromo: boolean; discount: number } {
  const originalPrice = item.price;
  
  // Check if promo is enabled and configured
  if (!item.promoEnabled || !item.promoType || item.promoValue === undefined) {
    return { price: originalPrice, hasActivePromo: false, discount: 0 };
  }
  
  // Check if promo is currently active
  const isActive = isPromoActive(
    item.promoDays,
    item.promoStartTime,
    item.promoEndTime,
    item.promoStartDate,
    item.promoEndDate,
    currentDate
  );
  
  if (!isActive) {
    return { price: originalPrice, hasActivePromo: false, discount: 0 };
  }
  
  // Calculate promo price
  const promoPrice = calculatePromoPrice(originalPrice, item.promoType, item.promoValue);
  const discount = originalPrice - promoPrice;
  
  return { price: promoPrice, hasActivePromo: true, discount };
}

/**
 * Check if item meets minimum purchase requirement
 */
export function meetsMinimumPurchase(
  quantity: number,
  pricePerItem: number,
  promoMinPurchase?: number
): boolean {
  if (!promoMinPurchase) return true;
  
  const totalAmount = quantity * pricePerItem;
  return totalAmount >= promoMinPurchase;
}

/**
 * Format promo description for display
 */
export function formatPromoDescription(item: Product | ProductPackage | Bundle): string {
  if (!item.promoEnabled || !item.promoType || item.promoValue === undefined) {
    return '';
  }
  
  if (item.promoType === 'percentage') {
    return `Diskon ${item.promoValue}%`;
  } else {
    return `Diskon Rp ${item.promoValue.toLocaleString('id-ID')}`;
  }
}

/**
 * Get promo schedule description
 */
export function getPromoSchedule(item: Product | ProductPackage | Bundle): string {
  const parts: string[] = [];
  
  // Days
  if (item.promoDays && item.promoDays.length > 0) {
    if (item.promoDays.length === 7) {
      parts.push('Setiap hari');
    } else {
      const dayMap: Record<string, string> = {
        'Monday': 'Sen',
        'Tuesday': 'Sel',
        'Wednesday': 'Rab',
        'Thursday': 'Kam',
        'Friday': 'Jum',
        'Saturday': 'Sab',
        'Sunday': 'Min'
      };
      const dayNames = item.promoDays.map(d => dayMap[d] || d).join(', ');
      parts.push(dayNames);
    }
  }
  
  // Time
  if (item.promoStartTime && item.promoEndTime) {
    parts.push(`${item.promoStartTime} - ${item.promoEndTime}`);
  }
  
  // Date range
  if (item.promoStartDate && item.promoEndDate) {
    const start = new Date(item.promoStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const end = new Date(item.promoEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    parts.push(`${start} - ${end}`);
  }
  
  return parts.join(' • ');
}

/**
 * Validate promo configuration
 */
export function validatePromoConfig(config: Partial<PromoConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.promoEnabled) {
    if (!config.promoType) {
      errors.push('Tipe promo harus dipilih');
    }
    
    if (config.promoValue === undefined || config.promoValue <= 0) {
      errors.push('Nilai promo harus lebih dari 0');
    }
    
    if (config.promoType === 'percentage' && config.promoValue && config.promoValue > 100) {
      errors.push('Persentase diskon tidak boleh lebih dari 100%');
    }
    
    if (!config.promoDays || config.promoDays.length === 0) {
      errors.push('Minimal pilih 1 hari untuk promo');
    }
    
    if (!config.promoStartTime || !config.promoEndTime) {
      errors.push('Jam mulai dan selesai promo harus diisi');
    }
    
    if (config.promoStartTime && config.promoEndTime && config.promoStartTime >= config.promoEndTime) {
      errors.push('Jam selesai harus lebih besar dari jam mulai');
    }
    
    if (config.promoStartDate && config.promoEndDate && config.promoStartDate > config.promoEndDate) {
      errors.push('Tanggal selesai harus lebih besar dari tanggal mulai');
    }
  }
  
  return { valid: errors.length === 0, errors };
}
