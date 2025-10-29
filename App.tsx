import React, { useState, useEffect, useCallback } from 'react';
import { Platform, AccountType, SavedProduct, PlatformConfig, GlobalConfig } from './types';
import { INITIAL_PLATFORM_CONFIGS, INITIAL_GLOBAL_CONFIG } from './constants';
import ToggleSwitch from './components/ToggleSwitch';
import Calculator from './components/Calculator';

type Tab = 'shopee' | 'mercadolivre' | 'config' | 'produtos' | 'info';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-bold text-base transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400
        ${active ? 'bg-purple-700 text-white' : 'bg-white text-purple-700 hover:bg-purple-50 hover:transform hover:-translate-y-1'}`}
    >
        {children}
    </button>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('shopee');
    const [accountType, setAccountType] = useLocalStorage<AccountType>('accountType', 'cnpj');
    const [platformConfigs, setPlatformConfigs] = useLocalStorage<Record<Platform, PlatformConfig>>('platformConfigs', INITIAL_PLATFORM_CONFIGS);
    const [globalConfig, setGlobalConfig] = useLocalStorage<GlobalConfig>('globalConfig', INITIAL_GLOBAL_CONFIG);
    const [savedProducts, setSavedProducts] = useLocalStorage<SavedProduct[]>('savedProducts', []);

    const handleAccountTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAccountType(e.target.checked ? 'cpf' : 'cnpj');
    };

    const handlePlatformConfigChange = useCallback((platform: Platform, newConfig: PlatformConfig) => {
        setPlatformConfigs(prev => ({...prev, [platform]: newConfig}));
    }, [setPlatformConfigs]);

    const handleGlobalConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setGlobalConfig(prev => ({...prev, [id]: parseFloat(value) || 0}));
    };
    
    const handleSaveProduct = (product: SavedProduct) => {
        setSavedProducts(prev => [product, ...prev]);
    };

    const handleDeleteProduct = (id: string) => {
        if(window.confirm('Tem certeza que deseja excluir este produto?')) {
            setSavedProducts(prev => prev.filter(p => p.id !== id));
        }
    };
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    const renderContent = () => {
        switch (activeTab) {
            case 'shopee':
            case 'mercadolivre':
                return <Calculator
                    platform={activeTab}
                    accountType={accountType}
                    platformConfig={platformConfigs[activeTab]}
                    globalConfig={globalConfig}
                    onConfigChange={handlePlatformConfigChange}
                    onSaveProduct={handleSaveProduct}
                />;
            case 'config':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-purple-700 mb-6 pb-2 border-b-2 border-purple-200">Configurações Gerais</h2>
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Taxas de Impostos Padrão</h3>
                             <div className="form-group flex flex-col">
                                <label htmlFor="cnpjTax" className="font-bold mb-2 text-gray-700">Imposto CNPJ (%)</label>
                                <input type="number" id="cnpjTax" value={globalConfig.cnpjTax} onChange={handleGlobalConfigChange} step="0.01" className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"/>
                            </div>
                             <div className="form-group flex flex-col">
                                <label htmlFor="cpfTax" className="font-bold mb-2 text-gray-700">Imposto CPF (%)</label>
                                <input type="number" id="cpfTax" value={globalConfig.cpfTax} onChange={handleGlobalConfigChange} step="0.01" className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"/>
                            </div>
                        </div>
                    </div>
                );
            case 'produtos':
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-purple-700 mb-6 pb-2 border-b-2 border-purple-200">Produtos Salvos</h2>
                        {savedProducts.length === 0 ? (
                             <p className="text-center text-gray-500 py-8">Nenhum produto salvo ainda.</p>
                        ) : (
                            <div className="space-y-4">
                                {savedProducts.map(p => (
                                    <div key={p.id} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-white transition-shadow flex justify-between items-center flex-wrap">
                                        <div className="flex-1 min-w-[200px] mb-2 sm:mb-0">
                                            <p className="font-bold text-purple-700 text-lg">{p.productName}</p>
                                            <p className="text-sm text-gray-600">
                                                Venda: {formatCurrency(p.sellPrice)} | Custo: {formatCurrency(p.cost)} | Frete: {formatCurrency(p.shipping)}
                                            </p>
                                            <p className="text-xs text-gray-500 uppercase">{p.platform} - {p.accountType}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className={`px-4 py-2 rounded-lg font-bold text-lg ${p.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {formatCurrency(p.netProfit)}
                                            </div>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'info':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-purple-700 mb-6 pb-2 border-b-2 border-purple-200">Informações</h2>
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg" role="alert">
                          <h4 className="font-bold mb-2">Como usar a Calculadora</h4>
                          <p className="text-sm">
                            Esta calculadora foi projetada para ajudar você a precificar seus produtos de forma inteligente e lucrativa.
                            Preencha os campos de custo, frete e preço de venda. As taxas da plataforma e impostos são calculados automaticamente, mas você pode ajustá-los se necessário.
                            Alterne entre CNPJ e CPF para ver a diferença nos impostos. Salve seus cálculos para referência futura na aba 'Produtos Salvos'.
                          </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-gradient-to-br from-indigo-400 to-purple-600 min-h-screen p-2 sm:p-4 md:p-8">
            <div className="container max-w-5xl mx-auto">
                <header className="bg-white p-8 rounded-xl text-center mb-8 shadow-2xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-700">👗 Mary Kids</h1>
                    <p className="text-gray-600 mt-2 text-lg">Calculadora de Precificação Profissional</p>
                    <p className="text-xs text-gray-400 mt-2">Taxas atualizadas - Outubro 2025</p>
                </header>

                <div className="tabs flex gap-2 sm:gap-4 mb-6 flex-wrap">
                    <TabButton active={activeTab === 'shopee'} onClick={() => setActiveTab('shopee')}>🛍️ Shopee</TabButton>
                    <TabButton active={activeTab === 'mercadolivre'} onClick={() => setActiveTab('mercadolivre')}>📦 Mercado Livre</TabButton>
                    <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')}>⚙️ Configurações</TabButton>
                    <TabButton active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')}>📊 Produtos Salvos</TabButton>
                    <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>ℹ️ Informações</TabButton>
                </div>

                <main className="content bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
                    {(activeTab === 'shopee' || activeTab === 'mercadolivre') && (
                      <div className="toggle-container bg-gray-100 p-4 rounded-lg mb-8 flex items-center justify-center gap-4 flex-wrap">
                          <span className="toggle-label font-bold text-lg text-gray-800">Tipo de Cadastro:</span>
                          <ToggleSwitch id="accountTypeToggle" checked={accountType === 'cpf'} onChange={handleAccountTypeChange} />
                      </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;