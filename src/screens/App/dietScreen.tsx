import React, { useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native'
import { Bell, ChevronLeft, Clock4, Flame, Menu, Plus, Search } from 'lucide-react-native'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import SearchInput from '../../components/SearchInput'
import { Description } from '@radix-ui/react-dialog'


const categories = [
    { key: 'breakfast', label: 'Café da manhã' },
    { key: 'lunch', label: 'Almoço' },
    { key: 'dinner', label: 'Janta' },
]

const meals = [
    {
        id: '1',
        title: 'Salada de vagem com ovos e tomates',
        calories: '150 kcal',
        minutes: '20 min',
        imageUrl: 'https://img.freepik.com/free-photo/flat-lay-high-protein-meal-composition_23-2149089617.jpg?t=st=1758659698~exp=1758663298~hmac=b661d6019bff216241319760d77f0f38728ca66a81a64aa55467b1bac2872617&w=1480',
        authorName: 'Luana Alves',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&h=100&fit=crop',
        description: 'Uma refeição leve e rica em proteínas, perfeita para o almoço ou jantar rápido. Prato completo com vegetais frescos e carboidratos complexos para energia sustentada.',
        fat: '1.5 g',
        protein: '10.9 g',
        carbs: '13.5 g'
    },
    {
        id: '2',
        title: 'Refeição vegetariana balanceada',
        calories: '365 kcal',
        minutes: '30 min',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1935&auto=format&fit=crop',
        authorName: 'Carlos Lima',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&h=100&fit=crop',
        description: 'Prato completo com vegetais frescos e carboidratos complexos para energia sustentada.',
        fat: '2.2 g',
        protein: '8.3 g',
        carbs: '15.1 g'
    },
]

const planMeals = [
    { 
        title: 'Wrap de tortilha com falafel e salada fresca', 
        imageUrl: 'https://img.freepik.com/free-photo/fresh-homemade-chicken-tacos-recipe-idea_53876-105981.jpg?t=st=1758739113~exp=1758742713~hmac=476a012cf2ec3c6ea60c787aa2accd43889be8233062713720c7ca8fd5d90092&w=1060', 
        description: 'Um wrap leve e saboroso feito com tortilha macia, recheado com falafel crocante e uma salada fresca de vegetais. Ideal para uma refeição prática, nutritiva e cheia de proteínas vegetais, perfeito para quem busca uma opção saudável e deliciosa.',
        fat: '1.5 g', 
        protein: '10.9 g', 
        carbs: '13.5 g' 
    },
    { 
        title: 'Salada vegana saudável de vegetais', 
        imageUrl: 'https://img.freepik.com/free-photo/healthy-chickpea-salad-with-tomatolettuce-cucumber-black-slate-background_123827-32067.jpg?t=st=1758739142~exp=1758742742~hmac=d171927e554b693cf5605cb518281444f1b171f37e5b996fff113b6d0e58f748&w=1480', 
        description: 'Uma salada vegana nutritiva, composta por grão-de-bico, tomate, alface e pepino, perfeita para quem busca uma refeição leve, saudável e cheia de sabor. Rica em fibras, proteínas vegetais e vitaminas, é ideal para o almoço ou jantar.',
        fat: '1.5 g', 
        protein: '10.9 g', 
        carbs: '13.5 g' 
    }
  ];

const DietScreen: React.FC<any> = ({ navigation }) => {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('breakfast')
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [sheetIndex, setSheetIndex] = useState(0)
    const bottomSheetRef = useRef<BottomSheet | null>(null)
    const snapPoints = useMemo(() => ['30%', '55%'], [])

    const openSheet = () => {
        setIsSheetOpen(true)
        setSheetIndex(1)
    }

    const closeSheet = () => {
        setIsSheetOpen(false)
        setSheetIndex(0)
    }

    return (
        <View style={styles.container}>        
            {/* Header */}
            <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton}>
                <Menu size={24} color="#000" />
            </TouchableOpacity>

            <Image
                source={{ uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1758030169/MV_pukwcn.png" }}
                style={{ width: 80, height: 40 }}
                resizeMode="cover"
            />

            <TouchableOpacity style={styles.notificationButton}>
                <Bell size={24} color="#000" />
            </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Pesquisar"
                    icon={<Search size={20} color="#888" />}
                />

                <View style={styles.categoriesRow}>
                    {categories.map((c) => (
                        <TouchableOpacity
                            key={c.key}
                            onPress={() => setSelectedCategory(c.key)}
                            activeOpacity={0.9}
                            style={[styles.chip, selectedCategory === c.key && styles.chipActive]}
                        >
                            <Text style={[styles.chipText, selectedCategory === c.key && styles.chipTextActive]}>
                                {c.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Refeições</Text>

                {meals.map((meal) => (
                    <TouchableOpacity key={meal.id} style={styles.mealCard} activeOpacity={0.9} onPress={() => navigation.navigate('DietDetails', { meal: { ...meal, planMeals } })}>
                        <Image source={{ uri: meal.imageUrl }} style={{ width: '100%', height: 160 }} />
                        <View style={styles.mealInfo}>
                            <Text style={styles.mealTitle}>{meal.title}</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Flame size={14} color="#192126" />
                                    <Text style={styles.metaText}>{meal.calories}</Text>
                                </View>
                                <View style={styles.metaSeparator} />
                                <View style={styles.metaItem}>
                                    <Clock4 size={12} color="#192126" />
                                    <Text style={styles.metaText}>{meal.minutes}</Text>
                                </View>
                                <View style={styles.metaSeparator} />
                                <View style={styles.authorRow}>
                                    <Image source={{ uri: meal.authorAvatar }} style={styles.authorAvatar as any} />
                                    <Text style={styles.authorName}>{meal.authorName}</Text>
                                </View>
                                
                            </View>
                            {meal.description ? (
                                <Text style={styles.mealDescription} numberOfLines={2}>
                                    {meal.description}
                                </Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={openSheet}>
                <Plus size={24} color="#0F172A" />
            </TouchableOpacity>

            {isSheetOpen && (
                <BottomSheet
                    ref={bottomSheetRef}
                    snapPoints={snapPoints}
                    enablePanDownToClose={true}
                    onClose={closeSheet}
                    index={sheetIndex}
                    onChange={setSheetIndex}
                    backgroundStyle={styles.sheetBackground}
                    handleIndicatorStyle={styles.sheetHandle}
                >
                    <BottomSheetView style={styles.sheetContent}>
                        <Text style={styles.sheetTitle}>Ações</Text>
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85}>
                            <Text style={styles.sheetItemText}>Adicionar refeição</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85}>
                            <Text style={styles.sheetItemText}>Criar plano de dieta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85}>
                            <Text style={styles.sheetItemText}>Importar receita</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeSheet} activeOpacity={0.9}>
                            <Text style={styles.sheetCloseText}>Fechar</Text>
                        </TouchableOpacity>
                    </BottomSheetView>
                </BottomSheet>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    iconBtn: {
        padding: 10,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B1220',
        borderRadius: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 10 as any,
        marginTop: 12,
        marginBottom: 12,
    },
    chip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 29,
        paddingVertical: 8,
    },
    chipActive: {
        backgroundColor: '#BBF246',
    },
    chipText: {
        color: '#111827',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 12,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mealImage: {
        width: '100%',
        height: 160,
    },
    mealInfo: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    mealDescription: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 6,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 as any,
    },
    authorAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    authorName: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
    },
    mealOverlay: {
        ...StyleSheet.absoluteFillObject as any,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    mealInfoBox: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    mealTitle: {
        color: '#192126',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10 as any,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6 as any,
    },
    metaSeparator: {
        width: 1,
        height: 14,
        backgroundColor: '#E5E7EB',
    },
    metaDot: {
        color: '#6b7280',
        marginHorizontal: 4,
    },
    metaText: {
        color: '#191919',
        fontSize: 12,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#BBF246',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        marginBottom: 80
    },
    sheetBackground: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 18,
    },
    sheetHandle: {
        backgroundColor: '#d1d5db',
        width: 40,
        height: 4,
    },
    sheetContent: {
        flex: 1,
        padding: 16,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    sheetItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sheetItemText: {
        color: '#111827',
        fontWeight: '600',
    },
    sheetCloseBtn: {
        marginTop: 16,
        backgroundColor: '#111827',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    sheetCloseText: {
        color: '#fff',
        fontWeight: '700',
    },
    notificationButton: {
        padding: 8,
        zIndex: 45,
    },
    menuButton: {
        padding: 10,
        zIndex: 46,
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
      },
})

export default DietScreen;