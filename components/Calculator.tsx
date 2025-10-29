import React, { useState, useEffect } from 'react';
import { Platform, PlatformConfig, AccountType, CalculationInput, CalculationResult, SavedProduct, GlobalConfig } from '../types';

interface CalculatorProps {
  platform: Platform;
  accountType: AccountType;
  platformConfig: PlatformConfig;
  globalConfig: GlobalConfig;
  onConfigChange: (platform: Platform, newConfig: PlatformConfig) => void;
  onSaveProduct: (product: SavedProduct) => void;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Calculator: React.FC<CalculatorProps> = ({ platform, accountType, platformConfig, globalConfig, onConfigChange, onSaveProduct }) => {
  const [inputs, setInputs] = useState<CalculationInput>({
    productName: '',
    cost: 0,
    shipping: 0,
    sellPrice: 0,
  });
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shopeeProgram, setShopeeProgram] = useState<'standard' | 'freeShipping'>('standard');
  const [mlListingType, setMlListingType] = useState<'classic' | 'premium'>('classic');

  const taxRate = accountType === 'cnpj' ? globalConfig.cnpjTax : globalConfig.cpfTax;
  
  useEffect(() => {
    // Sync local UI state with prop data on initial load or platform change
    if (platform === 'shopee') {
        if (platformConfig.commission === 20) {
            setShopeeProgram('freeShipping');
        } else {
            setShopeeProgram('standard');
        }
    } else if (platform === 'mercadolivre') {
        if (platformConfig.commission === 17) {
            setMlListingType('premium');
        } else {
            setMlListingType('classic');
        }
    }
  }, [platform, platformConfig.commission]);
  
  // Handles dynamic fixed fee for Mercado Livre based on selling price
  useEffect(() => {
    if (platform === 'mercadolivre') {
        const sellPrice = inputs.sellPrice;
        let newFixedFee = 0; // Default for >= R$79 or invalid price

        if (sellPrice > 0 && sellPrice < 79) {
            if (sellPrice <= 29) {
                newFixedFee = 6.25;
            } else if (sellPrice <= 50) {
                newFixedFee = 6.50;
            } else { // 50 < price < 79
                newFixedFee = 6.75;
            }
        }
        
        if (newFixedFee !== platformConfig.fixedFee) {
            onConfigChange(platform, { ...platformConfig, fixedFee: newFixedFee });
        }
    }
  }, [inputs.sellPrice, platform, onConfigChange, platformConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setInputs(prev => ({ ...prev, [id]: value ? parseFloat(value) : 0 }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setInputs(prev => ({ ...prev, [id]: value }));
  };
  
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    onConfigChange(platform, { ...platformConfig, [id]: value ? parseFloat(value) : 0 });
  };
  
  const handleShopeeProgramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const program = e.target.value as 'standard' | 'freeShipping';
      setShopeeProgram(program);
      const newCommission = program === 'standard' ? 14 : 20;
      onConfigChange(platform, { ...platformConfig, commission: newCommission, fixedFee: 4.0 });
  };

  const handleMlListingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const type = e.target.value as 'classic' | 'premium';
      setMlListingType(type);
      const newCommission = type === 'classic' ? 13 : 17;
      // Fixed fee is now dynamic, so we only change the commission here.
      onConfigChange(platform, { ...platformConfig, commission: newCommission });
  };

  const calculate = () => {
    const { sellPrice, cost, shipping } = inputs;
    const { commission, fixedFee, paymentFee } = platformConfig;

    if (sellPrice <= 0) {
        alert("O preço de venda deve ser maior que zero.");
        return;
    }

    let commissionValue = sellPrice * (commission / 100);
    if (platform === 'shopee' && commissionValue > 100) {
        commissionValue = 100;
    }

    const paymentFeeValue = sellPrice * (paymentFee / 100);
    const taxValue = sellPrice * (taxRate / 100);
    
    const totalTaxesAndFees = commissionValue + fixedFee + paymentFeeValue + taxValue;
    const netReceived = sellPrice - totalTaxesAndFees;
    const netProfit = netReceived - cost - shipping;
    const profitMargin = (netProfit / sellPrice) * 100;

    setResults({ netReceived, netProfit, profitMargin, totalTaxesAndFees });
    setShowResults(true);
  };
  
  const handleSave = () => {
    if (results && inputs.productName) {
      const productToSave: SavedProduct = {
        id: new Date().toISOString(),
        platform,
        accountType,
        ...inputs,
        ...results
      };
      onSaveProduct(productToSave);
      alert('Produto salvo com sucesso!');
    } else {
      alert('Por favor, dê um nome ao produto antes de salvar.');
    }
  };

  return (
    <div>
      {platform === 'shopee' && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-2">Programa Shopee</h3>
          <div className="flex rounded-lg p-1 bg-gray-200">
            <label className="flex-1 text-center">
              <input type="radio" name="shopeeProgram" value="standard" checked={shopeeProgram === 'standard'} onChange={handleShopeeProgramChange} className="sr-only peer" />
              <span className="block py-2 px-4 rounded-md cursor-pointer peer-checked:bg-purple-600 peer-checked:text-white font-semibold transition-colors duration-300">
                Padrão
              </span>
            </label>
            <label className="flex-1 text-center">
              <input type="radio" name="shopeeProgram" value="freeShipping" checked={shopeeProgram === 'freeShipping'} onChange={handleShopeeProgramChange} className="sr-only peer" />
              <span className="block py-2 px-4 rounded-md cursor-pointer peer-checked:bg-purple-600 peer-checked:text-white font-semibold transition-colors duration-300">
                Frete Grátis
              </span>
            </label>
          </div>
        </div>
      )}

      {platform === 'mercadolivre' && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-2">Tipo de Anúncio Mercado Livre</h3>
          <div className="flex rounded-lg p-1 bg-gray-200">
            <label className="flex-1 text-center">
              <input type="radio" name="mlListingType" value="classic" checked={mlListingType === 'classic'} onChange={handleMlListingChange} className="sr-only peer" />
              <span className="block py-2 px-4 rounded-md cursor-pointer peer-checked:bg-purple-600 peer-checked:text-white font-semibold transition-colors duration-300">
                Clássico
              </span>
            </label>
            <label className="flex-1 text-center">
              <input type="radio" name="mlListingType" value="premium" checked={mlListingType === 'premium'} onChange={handleMlListingChange} className="sr-only peer" />
              <span className="block py-2 px-4 rounded-md cursor-pointer peer-checked:bg-purple-600 peer-checked:text-white font-semibold transition-colors duration-300">
                Premium
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="form-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="form-group flex flex-col">
          <label htmlFor="productName" className="font-bold mb-2 text-gray-700">Nome do Produto / SKU</label>
          <input type="text" id="productName" placeholder="Ex: Vestido Rosa P" value={inputs.productName} onChange={handleTextChange} className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
        </div>
        <div className="form-group flex flex-col">
          <label htmlFor="cost" className="font-bold mb-2 text-gray-700">Custo Total (R$)</label>
          <input type="number" id="cost" placeholder="0.00" step="0.01" value={inputs.cost || ''} onChange={handleInputChange} className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
        </div>
        <div className="form-group flex flex-col">
          <label htmlFor="shipping" className="font-bold mb-2 text-gray-700">Frete Estimado (R$)</label>
          <input type="number" id="shipping" placeholder="0.00" step="0.01" value={inputs.shipping || ''} onChange={handleInputChange} className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
        </div>
        <div className="form-group flex flex-col">
          <label htmlFor="sellPrice" className="font-bold mb-2 text-gray-700">Preço de Venda (R$)</label>
          <input type="number" id="sellPrice" placeholder="0.00" step="0.01" value={inputs.sellPrice || ''} onChange={handleInputChange} className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
        </div>
      </div>

      <div className="config-section bg-gray-50 p-5 rounded-lg mb-6">
        <h3 className="mb-4 text-lg font-semibold text-purple-700">Taxas da Plataforma (Editável)</h3>
        <div className="config-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group flex flex-col">
            <label htmlFor="commission" className="font-bold mb-2 text-gray-700">Comissão (%)</label>
            <input type="number" id="commission" value={platformConfig.commission} onChange={handleFeeChange} step="0.01" className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="fixedFee" className="font-bold mb-2 text-gray-700">
                Taxa Fixa (R$)
                {platform === 'mercadolivre' && <span className="font-normal text-sm text-gray-500 ml-1">(automática)</span>}
            </label>
            <input 
                type="number" 
                id="fixedFee" 
                value={platformConfig.fixedFee} 
                onChange={handleFeeChange} 
                step="0.01" 
                className={`p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${platform === 'mercadolivre' ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                readOnly={platform === 'mercadolivre'}
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="paymentFee" className="font-bold mb-2 text-gray-700">Taxa Pagamento (%)</label>
            <input type="number" id="paymentFee" value={platformConfig.paymentFee} onChange={handleFeeChange} step="0.01" className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"/>
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="tax" className="font-bold mb-2 text-gray-700">Impostos (%)</label>
            <input type="number" id="tax" value={taxRate} step="0.01" readOnly className="p-3 border-2 border-gray-200 rounded-lg bg-gray-200 cursor-not-allowed"/>
          </div>
        </div>
      </div>

      <button onClick={calculate} className="calculate-btn w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-700 text-white rounded-lg text-xl font-bold cursor-pointer transition-transform transform hover:scale-105 hover:shadow-xl">
        💰 Calcular Precificação
      </button>

      {showResults && results && (
        <div className="results mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg animate-fadeIn">
          <h3 className="mb-5 text-xl font-semibold text-purple-700">Resultados da Análise</h3>
          <div className="result-grid grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
            <div className="result-item bg-white p-5 rounded-lg shadow-md">
              <div className="result-label text-sm text-gray-500 mb-2">Valor Líquido Recebido</div>
              <div className="result-value text-3xl font-bold text-purple-700">{formatCurrency(results.netReceived)}</div>
            </div>
            <div className="result-item bg-white p-5 rounded-lg shadow-md">
              <div className="result-label text-sm text-gray-500 mb-2">Lucro Líquido</div>
              <div className={`result-value text-3xl font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(results.netProfit)}</div>
            </div>
            <div className="result-item bg-white p-5 rounded-lg shadow-md">
              <div className="result-label text-sm text-gray-500 mb-2">Margem de Lucro</div>
              <div className={`result-value text-3xl font-bold ${results.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{results.profitMargin.toFixed(2)}%</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">Total de taxas e impostos: {formatCurrency(results.totalTaxesAndFees)}</p>
          <div className="text-center mt-6">
              <button onClick={handleSave} className="px-6 py-2 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-800 transition-colors">
                  Salvar Produto
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;