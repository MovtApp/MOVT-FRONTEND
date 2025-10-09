import React, { useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native'
import { Bell, ChevronLeft, CirclePlus, Clock4, Flame, Menu, Plus, Search, SquarePen, Trash } from 'lucide-react-native'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import SearchInput from '../../components/SearchInput'
import { Alert } from 'react-native'
import { useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DietFormSheet from '../../components/DietFormSheet'; // Importar o novo componente

interface DietMeal {
    id_dieta: string; // ID da dieta (backend)
    id: string; // Mapeado do id_dieta para uso no frontend
    title: string; // Mapeado do nome (backend)
    calories: string; // Mapeado de calorias (backend)
    minutes: string; // Mapeado de tempo_preparo (backend)
    imageUrl: string; // Mapeado de imageurl (backend)
    authorName: string; // Mapeado de nome_autor (backend)
    authorAvatar: string; // Mapeado de avatar_autor_url (backend)
    description?: string; // Mapeado de descricao (backend)
    fat?: string;
    protein?: string;
    carbs?: string;
}

const categories = [
    { key: 'all', label: 'Todas' }, // Adiciona a opção 'Todas'
    { key: 'breakfast', label: 'Café da manhã' },
    { key: 'lunch', label: 'Almoço' },
    { key: 'dinner', label: 'Janta' },
]

const DietScreen: React.FC<any> = ({ navigation }) => {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all') // Define a categoria inicial como 'all'
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [sheetIndex, setSheetIndex] = useState(0)
    const bottomSheetRef = useRef<BottomSheet | null>(null)
    const snapPoints = useMemo(() => ['34%', '50%'], [])
    const [dietMeals, setDietMeals] = useState<DietMeal[]>([]); // Estado para armazenar as dietas, tipado
    const { user } = useAuth(); // Obter o usuário do AuthContext
    const [isFormSheetOpen, setIsFormSheetOpen] = useState(false); // Estado para controlar o DietFormSheet
    const [formInitialData, setFormInitialData] = useState<DietMeal | undefined>(undefined); // Dados para edição
    const dietFormSheetRef = useRef<BottomSheet | null>(null); // Ref para o DietFormSheet

    const openSheet = () => {
        setIsSheetOpen(true)
        setSheetIndex(1)
    }

    const closeSheet = () => {
        setIsSheetOpen(false)
        setSheetIndex(0)
    }

    const fetchMeals = async () => {
        try {
            const response = await api.get('/dietas', {
                headers: {
                    Authorization: `Bearer ${user?.sessionId}`,
                },
                params: {
                    categoria: selectedCategory === 'all' ? undefined : selectedCategory,
                },
            });
            // Mapeia os dados do backend para o formato esperado pelo frontend
            const mappedMeals: DietMeal[] = response.data.data.map((backendMeal: any) => ({
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
                categoria: backendMeal.categoria || undefined, // Inclui a categoria
            }));
            // Remove dietas duplicadas com base no ID
            const uniqueMeals = Array.from(new Map(mappedMeals.map(meal => [meal.id, meal])).values());
            console.log("Dietas mapeadas com sucesso.");
            setDietMeals(uniqueMeals); // Atualiza o estado com as dietas mapeadas e únicas
        } catch (error) {
            console.error("Erro ao buscar dietas:", error);
            console.error("Detalhes do erro:", (error as any).response?.data || (error as any).message);
            Alert.alert("Erro", "Não foi possível carregar as dietas.");
        }
    };

    useEffect(() => {
        fetchMeals();
    }, [user?.sessionId, selectedCategory]); // Adiciona selectedCategory como dependência

    const handleAddDiet = () => {
        setFormInitialData(undefined); // Limpa os dados iniciais para adicionar nova dieta
        setIsFormSheetOpen(true); // Abre o DietFormSheet
        closeSheet(); // Fecha o BottomSheet de ações
    };

    const handleEditDiet = (dietId: string) => {
        const dietToEdit = dietMeals.find(meal => meal.id === dietId); // Encontra a dieta para edição
        if (dietToEdit) {
            setFormInitialData(dietToEdit); // Define os dados iniciais para edição
            setIsFormSheetOpen(true); // Abre o DietFormSheet
            closeSheet(); // Fecha o BottomSheet de ações
        } else {
            Alert.alert("Erro", "Dieta não encontrada para edição.");
        }
    };

    const handleFormSubmit = async (dietData: any) => {
        // Esta função será chamada pelo DietFormSheet quando o formulário for enviado
        if (dietData.id_dieta) {
            // Modo de Edição
            try {
                await api.put(`/dietas/${dietData.id_dieta}`, dietData, {
                    headers: {
                        Authorization: `Bearer ${user?.sessionId}`,
                    },
                });
                Alert.alert("Sucesso", "Dieta editada com sucesso!");
                fetchMeals();
            } catch (error) {
                console.error("Erro ao editar dieta:", error);
                Alert.alert("Erro", "Não foi possível editar a dieta.");
            }
        } else {
            // Modo de Adição
            try {
                await api.post('/dietas', dietData, {
                    headers: {
                        Authorization: `Bearer ${user?.sessionId}`,
                    },
                });
                Alert.alert("Sucesso", "Dieta adicionada com sucesso!");
                fetchMeals();
            } catch (error) {
                console.error("Erro ao adicionar dieta:", error);
                Alert.alert("Erro", "Não foi possível adicionar a dieta.");
            }
        }
        setIsFormSheetOpen(false); // Fecha o DietFormSheet
    };

    const handleDeleteDiet = async (dietId: string) => {
        Alert.alert("Confirmar Exclusão", "Tem certeza que deseja excluir esta dieta?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                onPress: async () => {
                    try {
                        await api.delete(`/dietas/${dietId}`, {
                            headers: {
                                Authorization: `Bearer ${user?.sessionId}`,
                            },
                        });
                        Alert.alert("Sucesso", "Dieta excluída com sucesso!");
                        fetchMeals(); // Recarrega as dietas após excluir
                    } catch (error) {
                        console.error("Erro ao excluir dieta:", error);
                        Alert.alert("Erro", "Não foi possível excluir a dieta.");
                    }
                    closeSheet();
                },
            },
        ]);
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

                {dietMeals.map((meal) => (
                    <TouchableOpacity key={meal.id_dieta} style={styles.mealCard} activeOpacity={0.9} onPress={() => navigation.navigate('DietDetails', { meal: { ...meal } })}>
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
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85} onPress={() => handleAddDiet()}> 
                            <CirclePlus size={20} color="#192126" />
                            <Text style={styles.sheetItemText}>Adicionar dieta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85} onPress={() => handleEditDiet("mock_diet_id_1")}> 
                            <SquarePen size={20} color="#192126" />
                            <Text style={styles.sheetItemText}>Editar dieta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetItem} activeOpacity={0.85} onPress={() => handleDeleteDiet("mock_diet_id_1")}> 
                            <Trash size={20} color="#192126"/>
                            <Text style={styles.sheetItemText}>Excluir</Text>
                        </TouchableOpacity>
                    </BottomSheetView>
                </BottomSheet>
            )}

            {/* DietFormSheet para Adicionar/Editar Dieta */}
            {isFormSheetOpen && (
                <DietFormSheet
                    isOpen={isFormSheetOpen}
                    onClose={() => setIsFormSheetOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={formInitialData}
                    bottomSheetRef={dietFormSheetRef}
                    sheetIndex={1} // Inicia aberto em um ponto maior
                    setSheetIndex={() => {}} // Não precisamos de controle externo de index aqui
                />
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
        backgroundColor: '#192126',
        borderRadius: 10,
        paddingHorizontal: 29,
        paddingVertical: 8,
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
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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