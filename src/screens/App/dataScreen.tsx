import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView, ScrollView, Text, View, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image } from 'react-native'
import { Bell, Menu } from 'lucide-react-native';
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDrawerParamList, AppStackParamList } from "../../@types/routes";

const { width } = Dimensions.get('window');

interface MenuButtonProps {
  onPress: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <Menu size={24} color="#192126" />
    </TouchableOpacity>
  );
};

const DataScreen: React.FC = () => {
    type DataScreenNavigationProp = CompositeNavigationProp<
        DrawerNavigationProp<AppDrawerParamList, 'HomeStack'>,
        NativeStackNavigationProp<AppStackParamList, 'DataScreen'>
    >;
    const navigation = useNavigation<DataScreenNavigationProp>();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
    const flatListRef = useRef<FlatList>(null);

    const DAY_ITEM_WIDTH = 50 + (4 * 2); // Largura do item + margemHorizontal * 2 (50 de width + 4 de margin em cada lado)

    const handleFlatListLayout = () => {
        if (flatListRef.current) {
            const flatListVisibleWidth = width - (20 * 2); 
            const offset = (selectedDay - 1) * DAY_ITEM_WIDTH - (flatListVisibleWidth / 2) + (DAY_ITEM_WIDTH / 2);
            flatListRef.current.scrollToOffset({ offset: Math.max(0, offset), animated: false });
        }
    };

    const getMonthAndYear = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('pt-BR', options);
        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getDayOfWeek = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        const dayIndex = date.getDay(); 
        const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; 
        return days[dayIndex];
    };

    const monthNameAndYear = getMonthAndYear(currentDate);
    const totalDaysInMonth = getDaysInMonth(currentDate);
    const daysInMonthArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const renderDay = ({ item }: { item: number }) => (
        <TouchableOpacity
            style={[styles.dayContainer, item === selectedDay && styles.selectedDayContainer]}
            onPress={() => setSelectedDay(item)}
        >
            <Text style={styles.dayOfWeek}>{getDayOfWeek(currentYear, currentMonth, item)}</Text>
            <Text style={[styles.dayOfMonth, item === selectedDay && styles.selectedDayOfMonth]}>{item}</Text>
        </TouchableOpacity>
    );

    const getItemLayout = (data: ArrayLike<any> | null | undefined, index: number) => (
        { length: DAY_ITEM_WIDTH, offset: DAY_ITEM_WIDTH * index, index }
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <MenuButton onPress={() => navigation.openDrawer()} />
                        <Image
                            source={{ uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1758030169/MV_pukwcn.png" }}
                            style={{ width: 80, height: 40 }}
                            resizeMode="cover"
                        />
                        <TouchableOpacity style={styles.iconButton}>
                            <Bell size={24} color="#192126" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.monthText}>{monthNameAndYear}</Text>
                <View>
                    <FlatList
                        horizontal
                        ref={flatListRef}
                        data={daysInMonthArray}
                        renderItem={renderDay}
                        keyExtractor={(item) => String(item)}
                        showsHorizontalScrollIndicator={false}
                        style={{ paddingTop: 10, marginBottom: 30 }}
                        initialScrollIndex={selectedDay - 1}
                        getItemLayout={getItemLayout}
                        onLayout={handleFlatListLayout}
                    />
                    <Text style={[styles.reportTitle, { marginTop: -10 }]}>Relatório de hoje</Text>
                </View>
                <View style={styles.cardsContainer}>
                    {/* Card de Calorias Gastas */}
                    <TouchableOpacity style={[styles.card, styles.caloriesCard]}>
                        <Text style={styles.cardCategory}>Calorias gastas</Text>
                        <Text style={[styles.cardValue, styles.caloriesValue]}>645 Kcal</Text>
                    </TouchableOpacity>

                    {/* Card de Ciclismo */}
                    <TouchableOpacity style={[styles.card, styles.cyclingCard]}>
                        <View>
                            <Text style={[styles.cardCategory, styles.cyclingCategory]}>Ciclismo</Text>
                            <View style={styles.cyclingGraphPlaceholder}></View>
                        </View>
                    </TouchableOpacity>

                    {/* Card de Tempo de Treino */}
                    <TouchableOpacity style={[styles.card, styles.trainingTimeCard]}>
                        <Text style={[styles.cardCategory, styles.trainingTimeCategory]}>Tempo de treino</Text>
                        <View style={styles.circularProgressPlaceholder}>
                            <Text style={[styles.cardValue, styles.trainingTimeValue]}>80%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Card de Batimentos */}
                    <TouchableOpacity style={[styles.card, styles.heartRateCard]}>
                        <Text style={[styles.cardCategory, styles.heartRateCategory]}>Batimentos</Text>
                        <View style={styles.heartRateGraphPlaceholder}></View>
                        <Text style={[styles.cardValue, styles.heartRateValue]}>79 Bpm</Text>
                    </TouchableOpacity>

                    {/* Card de Passos */}
                    <TouchableOpacity style={[styles.card, styles.stepsCard]}>
                        <Text style={[styles.cardCategory, styles.stepsCategory]}>Passos</Text>
                        <Text style={[styles.cardValue, styles.stepsValue]}>999/2000</Text>
                        <View style={styles.progressBarPlaceholder}>
                            <View style={styles.progressBarFill}></View>
                        </View>
                    </TouchableOpacity>

                    {/* Card de Keep it Up! */}
                    <TouchableOpacity style={[styles.card, styles.keepItUpCard]}>
                        <Text style={styles.keepItUpText}>Keep it Up! 👋</Text>
                    </TouchableOpacity>

                    {/* Card de Sono */}
                    <TouchableOpacity style={[styles.card, styles.sleepCard]}>
                        <Text style={[styles.cardCategory, styles.sleepCategory]}>Sono</Text>
                        <View style={styles.sleepGraphPlaceholder}></View>
                    </TouchableOpacity>

                    {/* Card de Água */}
                    <TouchableOpacity style={[styles.card, styles.waterCard]}>
                        <Text style={[styles.cardCategory, styles.waterCategory]}>Água</Text>
                        <View style={styles.waterFillPlaceholder}>
                            <Text style={[styles.cardValue, styles.waterValue]}>6/8 Copos</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 0, 
        paddingBottom: 5,
    },
    header: {
        backgroundColor: "#fff",
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 45,
        marginBottom: 0, 
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    menuButton: {
        padding: 10,
        zIndex: 46,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButton: {
        padding: 10,
        zIndex: 46,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthText: {
        color: '#192126',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 0, 
        marginBottom: 0, 
    },
    dayContainer: {
        width: 50,
        height: 70,
        borderRadius: 15,
        backgroundColor: '#282828',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    selectedDayContainer: {
        backgroundColor: '#1E1E1E',
        borderColor: '#8BC34A',
        borderWidth: 2,
    },
    dayOfWeek: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 5,
    },
    dayOfMonth: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    selectedDayOfMonth: {
        color: '#8BC34A',
    },
    reportTitle: {
        color: '#192126',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 0, 
        marginBottom: 15,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#3A3A3A',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        justifyContent: 'center',
    },
    cardCategory: {
        color: '#192126',
        fontSize: 12,
        marginBottom: 5,
    },
    cardValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    caloriesCard: {
        backgroundColor: '#FFFFFF',
        height: 150,
        padding: 15,
        borderRadius: 16,
        borderColor: '#192126',
        borderWidth: 1,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    caloriesValue: {
        color: '#333',
        fontSize: 24,
    },
    cyclingCard: {
        backgroundColor: '#1E1E1E',
        height: 150,
        width: '48%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cyclingCategory: {
        color: '#ccc',
        fontSize: 12,
        marginBottom: 5,
    },
    cyclingGraphPlaceholder: {
        width: '100%',
        height: 80,
        backgroundColor: '#282828',
        borderRadius: 10,
    },
    trainingTimeCard: {
        backgroundColor: '#F5EEFB',
        width: '48%',
        height: 120,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trainingTimeCategory: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    circularProgressPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 5,
        borderColor: '#D8BFD8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trainingTimeValue: {
        color: '#8A2BE2',
        fontSize: 20,
    },
    heartRateCard: {
        backgroundColor: '#FCE7F3',
        width: '48%',
        height: 120,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heartRateCategory: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    heartRateGraphPlaceholder: {
        width: '100%',
        height: 40,
        backgroundColor: '#FFDDEE',
        borderRadius: 5,
    },
    heartRateValue: {
        color: '#FF69B4',
        fontSize: 18,
    },
    stepsCard: {
        backgroundColor: '#FFF3E0',
        width: '48%',
        height: 120,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stepsCategory: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    stepsValue: {
        color: '#FF8C00',
        fontSize: 18,
    },
    progressBarPlaceholder: {
        width: '100%',
        height: 10,
        backgroundColor: '#FFE0B2',
        borderRadius: 5,
        marginTop: 10,
    },
    progressBarFill: {
        width: '50%',
        height: '100%',
        backgroundColor: '#FFB74D',
        borderRadius: 5,
    },
    keepItUpCard: {
        backgroundColor: '#FFF3E0',
        width: '48%',
        height: 50,
        padding: 10,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keepItUpText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sleepCard: {
        backgroundColor: '#E0F2F7',
        width: '48%',
        height: 120,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sleepCategory: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    sleepGraphPlaceholder: {
        width: '100%',
        height: 40,
        backgroundColor: '#CCEEFF',
        borderRadius: 5,
    },
    waterCard: {
        backgroundColor: '#E3F2FD',
        width: '48%',
        height: 120,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    waterCategory: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
    },
    waterFillPlaceholder: {
        width: '100%',
        height: 60,
        backgroundColor: '#BBDEFB',
        borderRadius: 10,
        justifyContent: 'flex-end',
    },
    waterValue: {
        color: '#4682B4',
        paddingBottom: 5,
        paddingLeft: 5,
        fontSize: 18,
    },
    bottomNavigationBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#282828',
        paddingVertical: 10,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    navBarItem: {
        padding: 10,
        alignItems: 'center',
    },
    navBarText: {
        color: '#fff',
        fontSize: 12,
    },
    navBarIconPlaceholder: {
        width: 24,
        height: 24,
        backgroundColor: '#555',
        borderRadius: 12,
        marginBottom: 5,
    },
    navBarItemSelected: {
        backgroundColor: '#8BC34A',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    navBarTextSelected: {
        color: '#1E1E1E',
        fontSize: 12,
        fontWeight: 'bold',
    },
    navBarIconSelectedPlaceholder: {
        width: 24,
        height: 24,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginBottom: 5,
    },
});

export default DataScreen;