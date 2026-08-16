import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { secureGet } from './secureStore';

// TODO: Substituir pela chave de API real da Apple (iOS) do RevenueCat
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_API_KEY_HERE';

export const initRevenueCat = async () => {
  if (Platform.OS === 'ios') {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
    
    // Se o usuário já estiver logado, podemos identificá-lo no RevenueCat
    try {
      const userId = await secureGet('userId'); // Supondo que você armazena o ID do usuário
      if (userId) {
        await Purchases.logIn(userId);
      }
    } catch (e) {
      console.log('Erro ao identificar usuário no RevenueCat no init:', e);
    }
  }
};

export const getPackages = async (): Promise<PurchasesPackage[]> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.error('Erro ao buscar pacotes do RevenueCat:', e);
    return [];
  }
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error('Erro ao realizar compra no RevenueCat:', e);
      throw e;
    }
    return null; // Usuário cancelou a compra
  }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    // 'premium' deve ser o exato nome do Entitlement que você criar no painel do RevenueCat
    return typeof customerInfo.entitlements.active['premium'] !== 'undefined';
  } catch (e) {
    console.error('Erro ao checar status premium no RevenueCat:', e);
    return false;
  }
};
