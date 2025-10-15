import React, { useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native'
import { Bell, CirclePlus, Clock4, Flame, Menu, Plus, Search, SquarePen, Trash } from 'lucide-react-native'
import SearchInput from '../../components/SearchInput'
import { Alert } from 'react-native'
import { useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DietFormSheet from '../../components/DietFormSheet'; // Importar o novo componente
import { Check } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
 
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
     const [dietMeals, setDietMeals] = useState<DietMeal[]>([]); // Estado para armazenar as dietas, tipado
     const { user } = useAuth(); // Obter o usuário do AuthContext
     const [isFormSheetOpen, setIsFormSheetOpen] = useState(false); // Estado para controlar o DietFormSheet
     const [formInitialData, setFormInitialData] = useState<DietMeal | undefined>(undefined); // Dados para edição
     const dietFormSheetRef = useRef<any>(null); // Ref para o DietFormSheet
     const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
 
     const isAllSelected = dietMeals.length > 0 && selectedDietIds.length === dietMeals.length;
 
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
             setSelectedDietIds(dietMeals.map(m => m.id_dieta));
         }
     };
 
     const handlePickImage = async () => {
         try {
             const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
             if (status !== 'granted') {
                 Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para selecionar imagens.');
                 return;
             }
             const result = await ImagePicker.launchImageLibraryAsync({
                 mediaTypes: ImagePicker.MediaTypeOptions.Images,
                 allowsEditing: true,
                 quality: 0.9,
                 selectionLimit: 1,
             });
             if (result.canceled) return;
         } catch (e) {
             console.error('Erro ao selecionar imagem:', e);
             Alert.alert('Erro', 'Não foi possível abrir a galeria.');
         }
     };
 
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
     };
 
     const handleEditDiet = (dietId: string) => {
         const dietToEdit = dietMeals.find(meal => meal.id === dietId); // Encontra a dieta para edição
         if (dietToEdit) {
             setFormInitialData(dietToEdit); // Define os dados iniciais para edição
             setIsFormSheetOpen(true); // Abre o DietFormSheet
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
                             fetchMeals(); // Recarrega as dietas após excluir
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
                         <TouchableOpacity style={styles.actionIconButton} activeOpacity={0.85} onPress={handlePickImage}>
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
                         onLongPress={() => toggleSelect(meal.id_dieta)}
                     >
                         <Image source={{ uri: meal.imageUrl }} style={{ width: '100%', height: 160 }} />
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
         marginRight: 10, // Espaçamento entre os botões
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
         borderColor: '#BBF246',
         backgroundColor: '#fff',
         alignItems: 'center',
         justifyContent: 'center',
     },
     checkboxChecked: {
         backgroundColor: '#BBF246',
         borderColor: '#BBF246',
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
         marginBottom: 80
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