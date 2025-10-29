
export type Platform = 'shopee' | 'mercadolivre';

export type AccountType = 'cnpj' | 'cpf';

export interface PlatformConfig {
  commission: number;
  fixedFee: number;
  paymentFee: number;
}

export interface GlobalConfig {
  cnpjTax: number;
  cpfTax: number;
}

export interface CalculationInput {
  productName: string;
  cost: number;
  shipping: number;
  sellPrice: number;
}

export interface CalculationResult {
  netReceived: number;
  netProfit: number;
  profitMargin: number;
  totalTaxesAndFees: number;
}

export interface SavedProduct extends CalculationInput, CalculationResult {
  id: string;
  platform: Platform;
  accountType: AccountType;
}
