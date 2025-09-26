import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useState, useEffect } from 'react';
import RootStackParamList, { AppStackParamList } from '../@types/routes.ts';
import { ChartPie, House, Map, MessageCircle, Soup } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';

interface NavItem {
  name: keyof AppStackParamList;
  label: string;
  icon: any;
}

const BottomNavigationBar = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<keyof AppStackParamList>('HomeScreen');

  // Removemos o useEffect para não rastrear a rota ativa automaticamente
  useEffect(() => {
    setActiveTab(route.name as keyof AppStackParamList);
  }, [route.name]);

  const navItems: NavItem[] = [
    {
      name: 'HomeScreen',
      label: 'Início',
      icon: House
    },
    {
      name: 'MapScreen',
      label: 'Mapa',
      icon: Map
    },
    {
      name: 'DietScreen',
      label: 'Dieta',
      icon: Soup
    },
    {
      name: 'DataScreen',
      label: 'Dados',
      icon: ChartPie
    },
    {
      name: 'ChatScreen',
      label: 'Chat',
      icon: MessageCircle
    },
  ];

  const navigateTo = (screenName: keyof AppStackParamList) => {
    setActiveTab(screenName);
    navigation.navigate('App', { screen: screenName });
  };

  return (
    <View style={styles.container}>
      {navItems.map((item: NavItem) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={item.name as string}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => navigateTo(item.name)}
          >
            <item.icon size={24} color={isActive ? "#192126" : "#fff"} />
            {isActive && <Text style={styles.activeNavText}>{item.label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1E232C',
    height: 60,
    borderRadius: 100,
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeNavItem: {
    flexDirection: 'row',
    backgroundColor: '#8BC34A',
    borderRadius: 25,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavText: {
    color: '#192126',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default BottomNavigationBar;
