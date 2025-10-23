import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Bell, CirclePlus, Clock4, Flame, Menu, Plus, Search, SquarePen, Trash, Check } from 'lucide-react-native';
import SearchInput from '../../components/SearchInput';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DietFormSheet from '../../components/DietFormSheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, DietMeal } from '../../@types/routes';

const DietScreen: React.FC<NativeStackScreenProps<AppStackParamList, 'DietScreen'>> = ({ navigation, route }) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dietMeals, setDietMeals] = useState<DietMeal[]>([]);
    const { user } = useAuth();
    const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
    const [formInitialData, setFormInitialData] = useState<DietMeal | undefined>(undefined);
    const dietFormSheetRef = useRef<any>(null);
    const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
    const [sheetIndex, setSheetIndex] = useState(0);

    // const { setIsDietSheetOpen } = route.params;

    // useEffect(() => {
    //     setIsDietSheetOpen(isFormSheetOpen);
    // }, [isFormSheetOpen, setIsDietSheetOpen]);

    const categories = useMemo(() => [
        { key: 'all', label: 'Todas' },
        { key: 'breakfast', label: 'Café da manhã' },
        { key: 'lunch', label: 'Almoço' },
        { key: 'dinner', label: 'Janta' },
    ], []);

    const isAllSelected = useMemo(() => dietMeals.length > 0 && selectedDietIds.length === dietMeals.length, [dietMeals, selectedDietIds]);

    const toggleSelect = (dietId: string) => {
        setSelectedDietIds((prev) => {
            if (prev.includes(dietId)) {
                return prev.filter(id => id !== dietId);
            }
            return [...prev, dietId];
        });
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedDietIds([]);
        } else {
            setSelectedDietIds(dietMeals.map(m => m.id_dieta as string));
        }
    };

    const fetchMeals = useCallback(async () => {
        try {
            const response = await api.get('/dietas', {
                headers: {
                    Authorization: `Bearer ${user?.sessionId}`,
                },
                params: {
                    categoria: selectedCategory === 'all' ? undefined : selectedCategory,
                },
            });
            const mappedMeals: DietMeal[] = response.data.data.map((backendMeal: any) => {
                console.log('🖼️ Mapeando dieta:', backendMeal.nome, 'ImageURL:', backendMeal.imageurl);
                return {
                    id: String(backendMeal.id_dieta),
                    id_dieta: String(backendMeal.id_dieta),
                    title: backendMeal.nome,
                    calories: `${backendMeal.calorias || 0} kcal`,
                    minutes: `${backendMeal.tempo_preparo || 0} min`,
                    imageUrl: backendMeal.imageurl || 'https://via.placeholder.com/150',
                    authorName: backendMeal.nome_autor || 'Desconhecido',
                    authorAvatar: backendMeal.avatar_autor_url || 'https://via.placeholder.com/30',
                    description: backendMeal.descricao || '',
                    fat: `${backendMeal.gordura || 0} g`,
                    protein: `${backendMeal.proteina || 0} g`,
                    carbs: `${backendMeal.carboidratos || 0} g`,
                    categoria: backendMeal.categoria || undefined,
                    calorias: backendMeal.calorias || undefined,
                    tempo_preparo: backendMeal.tempo_preparo || undefined,
                    gordura: backendMeal.gordura || undefined,
                    proteina: backendMeal.proteina || undefined,
                    carboidratos: backendMeal.carboidratos || undefined,
                };
            });
            const uniqueMeals = Array.from(new Map(mappedMeals.map(meal => [meal.id, meal])).values());
            console.log("Dietas mapeadas com sucesso.");
            setDietMeals(uniqueMeals);
        } catch (error) {
            console.error("Erro ao buscar dietas:", error);
            console.error("Detalhes do erro:", (error as any).response?.data || (error as any).message);
            Alert.alert("Erro", "Não foi possível carregar as dietas.");
        }
    }, [user?.sessionId, selectedCategory]);

    useEffect(() => {
        fetchMeals();
    }, [user?.sessionId, selectedCategory, fetchMeals]);

    const handleAddDiet = () => {
        setFormInitialData(undefined);
        setSheetIndex(0);
        setIsFormSheetOpen(true);
    };

    const handleEditDiet = (dietId: string) => {
        const dietToEdit = dietMeals.find(meal => meal.id === dietId);
        if (dietToEdit) {
            setFormInitialData(dietToEdit);
            setIsFormSheetOpen(true);
        } else {
            Alert.alert("Erro", "Dieta não encontrada para edição.");
        }
    };

    const handleBulkEdit = () => {
        if (selectedDietIds.length === 1) {
            handleEditDiet(selectedDietIds[0]);
        } else {
            Alert.alert("Erro", "Selecione exatamente 1 dieta para editar.");
        }
    };

    const handleBulkDelete = () => {
        if (selectedDietIds.length > 0) {
            Alert.alert("Confirmar Exclusão", "Tem certeza que deseja excluir as dietas selecionadas?", [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            await Promise.all(selectedDietIds.map(id => api.delete(`/dietas/${id}`, {
                                headers: {
                                    Authorization: `Bearer ${user?.sessionId}`,
                                },
                            })));
                            Alert.alert("Sucesso", "Dietas excluídas com sucesso!");
                            fetchMeals();
                        } catch (error) {
                            console.error("Erro ao excluir dietas:", error);
                            Alert.alert("Erro", "Não foi possível excluir as dietas.");
                        }
                    },
                },
            ]);
        } else {
            Alert.alert("Erro", "Selecione pelo menos 1 dieta para excluir.");
        }
    };


    const handleCloseForm = () => {
        setIsFormSheetOpen(false);
        setSheetIndex(0);
        setFormInitialData(undefined);
    };

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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
                <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Pesquisar"
                    icon={<Search size={20} color="#888" />}
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
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
                </ScrollView>

                <View style={styles.selectAllRow}>
                    <TouchableOpacity activeOpacity={0.8} style={styles.selectAllButton} onPress={toggleSelectAll}>
                        <View style={[styles.checkbox, isAllSelected && styles.checkboxChecked]}
                        >
                            {isAllSelected && <Check size={16} color="#0F172A" />}
                        </View>
                        <Text style={styles.selectAllText}>{isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.85} onPress={handleAddDiet}>
                            <CirclePlus size={20} color="#192126" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionIconButton, selectedDietIds.length !== 1 && styles.actionIconDisabled]} activeOpacity={0.85} onPress={handleBulkEdit}>
                            <SquarePen size={20} color="#192126" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionIconButton, selectedDietIds.length === 0 && styles.actionIconDisabled]} activeOpacity={0.85} onPress={handleBulkDelete}>
                            <Trash size={20} color="#192126"/>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Refeições</Text>

                {dietMeals.map((meal) => (
                    <TouchableOpacity
                        key={meal.id_dieta}
                        style={[
                            styles.mealCard,
                            selectedDietIds.includes(meal.id_dieta) && styles.mealCardSelected,
                        ]}
                        activeOpacity={0.9}
                        onPress={() => {
                            if (selectedDietIds.length > 0) {
                                toggleSelect(meal.id_dieta);
                            } else {
                                navigation.navigate('DietDetails', { meal: { ...meal } });
                            }
                        }}
                        onLongPress={() => {
                            toggleSelect(meal.id_dieta);
                        }}
                    >
                        <Image 
                            source={{ uri: meal.imageUrl }} 
                            style={{ width: '100%', height: 160 }} 
                            onLoad={() => console.log('✅ Imagem carregada:', meal.imageUrl)}
                            onError={(error) => console.log('❌ Erro ao carregar imagem:', meal.imageUrl, error)}
                        />
                        <TouchableOpacity
                            style={styles.selectionCheckboxContainer}
                            onPress={() => toggleSelect(meal.id_dieta)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.checkbox, selectedDietIds.includes(meal.id_dieta) && styles.checkboxChecked]}
                            >
                                {selectedDietIds.includes(meal.id_dieta) && <Check size={16} color="#0F172A" />}
                            </View>
                        </TouchableOpacity>
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

            <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={handleAddDiet}>
                <Plus size={24} color="#0F172A" />
            </TouchableOpacity>

            {/* DietFormSheet para Adicionar/Editar Dieta (renderizado em portal acima do header) */}
            <View pointerEvents="box-none" style={styles.sheetPortal}>
                <DietFormSheet
                    isOpen={isFormSheetOpen}
                    onClose={handleCloseForm}
                    initialData={formInitialData}
                    bottomSheetRef={dietFormSheetRef}
                    sheetIndex={sheetIndex}
                    setSheetIndex={setSheetIndex}
                    onSuccess={fetchMeals}
                />
            </View>
        </View>
    );
};

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
        backgroundColor: '#192126',
        borderRadius: 10,
        paddingHorizontal: 29,
        paddingVertical: 8,
        marginRight: 10,
    },
    chipActive: {
        backgroundColor: '#BBF246',
    },
    chipText: {
        color: '#fff',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    selectAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10 as any,
        marginTop: 8,
    },
    selectedCount: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#192126',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#BBF246',
        borderColor: '#192126',
    },
    selectAllText: {
        color: '#111827',
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 as any,
    },
    actionIconButton: {
        padding: 6,
        backgroundColor: 'transparent',
    },
    actionIconDisabled: {
        opacity: 0.4,
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
    mealCardSelected: {
        borderColor: '#BBF246',
        borderWidth: 2,
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
        backgroundColor: 'rgba(0,0,0,0.2)',
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
    selectionCheckboxContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 2,
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
        marginBottom: 80,
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
    sheetPortal: {
        ...StyleSheet.absoluteFillObject as any,
        zIndex: 9999,
        elevation: 9999,
        pointerEvents: 'box-none',
    },
});

export default DietScreen;