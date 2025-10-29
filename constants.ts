import { Platform, PlatformConfig, GlobalConfig } from './types';

export const INITIAL_PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  shopee: {
    commission: 14.0,
    fixedFee: 4.0,
    paymentFee: 0,
  },
  mercadolivre: {
    commission: 13.0,
    fixedFee: 0, // This is now dynamic based on price, so it starts at 0.
    paymentFee: 0,
  },
};

export const INITIAL_GLOBAL_CONFIG: GlobalConfig = {
    cnpjTax: 6.93,
    cpfTax: 11.00,
};