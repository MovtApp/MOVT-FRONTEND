import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dietFormSchema, DietFormInputs } from './dietFormSchema';
import { useAuth } from '../hooks/useAuth';
import SelectInput from './SelectInput';
import { uploadImageToSupabase } from '../services/services';
import { api } from '../services/api';

interface DietMeal {
  id_dieta?: string;
  id: string;
  title: string;
  imageUrl: string;
  authorName: string;
  authorAvatar: string;
  description?: string;
  categoria?: string;
  calorias?: number;
  tempo_preparo?: number;
  carboidratos?: number;
  gordura?: number;
  proteina?: number;
}

interface DietFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DietMeal;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
  onSuccess?: () => void;
}

const mapDietMealToDietFormInputs = (meal: DietMeal | undefined, user: any): DietFormInputs => {
  return {
    id_dieta: meal?.id_dieta || undefined,
    nome: meal?.title || '',
    descricao: meal?.description || '',
    imageurl: meal?.imageUrl || '',
    categoria: meal?.categoria || '',
    calorias: meal?.calorias || undefined,
    tempo_preparo: meal?.tempo_preparo || undefined,
    carboidratos: meal?.carboidratos || undefined,
    gordura: meal?.gordura || undefined,
    proteina: meal?.proteina || undefined,
    nome_autor: meal?.authorName || user?.name || '',
    avatar_autor_url: meal?.authorAvatar || user?.photo || '',
  };
};

const DietFormSheet: React.FC<DietFormSheetProps> = ({
  isOpen,
  onClose,
  initialData,
  bottomSheetRef,
  sheetIndex,
  setSheetIndex,
  onSuccess,
}) => {
  const { user } = useAuth();
  const snapPoints = useMemo(() => ['90%', '100%'], []);
  
  const isAddingNewDiet = !initialData;
  const initialFormValues = useMemo(() => mapDietMealToDietFormInputs(initialData, user), [initialData, user]);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<DietFormInputs>({
    resolver: zodResolver(dietFormSchema),
    defaultValues: initialFormValues,
  });
  // const selectedCategory = watch('categoria'); // Variável não utilizada removida

  const [imageUri, setImageUri] = useState<string | null>(initialFormValues.imageurl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { label: "Café da manhã", value: "breakfast" },
    { label: "Almoço", value: "lunch" },
    { label: "Janta", value: "dinner" },
  ];

  useEffect(() => {
    reset(initialFormValues);
    setImageUri(initialFormValues.imageurl || null);
  }, [initialData, reset, initialFormValues]);

  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Garantir que o sheet abra na posição correta
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, [isOpen, bottomSheetRef]); // bottomSheetRef adicionado como dependência

  // Debug do estado isSubmitting
  useEffect(() => {
    console.log('🔄 Estado isSubmitting mudou para:', isSubmitting);
  }, [isSubmitting]);

  const setPickedImage = (uri: string) => {
    setImageUri(uri);
    setValue('imageurl', uri);
  };

  const handleImageSelection = () => {
    Alert.alert(
      "Selecionar Imagem",
      "Escolha a origem da imagem:",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Tirar Foto",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert("Permissão Necessária", "Precisamos da sua permissão para acessar a câmera.");
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setPickedImage(uri);
            }
          },
        },
        {
          text: "Selecionar da Galeria",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert("Permissão Necessária", "Precisamos da sua permissão para acessar a galeria de imagens.");
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setPickedImage(uri);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };


  const onSubmitForm = async (data: DietFormInputs) => {
    console.log('🎯 onSubmitForm chamada, isSubmitting atual:', isSubmitting);
    
    if (isSubmitting) {
      console.log('⚠️ Prevenindo múltiplos envios');
      return; // Prevenir múltiplos envios
    }
    
    if (!user || !user.sessionId) {
      Alert.alert('Erro', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    // Validação adicional dos campos obrigatórios
    if (!data.nome || !data.descricao || !data.imageurl || !data.categoria) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios: Nome, Descrição, Imagem e Categoria.');
      return;
    }

    console.log('✅ Validações passaram, definindo isSubmitting = true');
    setIsSubmitting(true);
    
    // Fallback para garantir que o estado seja resetado após 15 segundos
    const fallbackTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de segurança ativado - resetando estado');
      setIsSubmitting(false);
    }, 30000); // Reduzido para 30 segundos

    let imageUrlToUpload = data.imageurl;
    console.log('🖼️ URL da imagem:', imageUrlToUpload);

    // Se a imagem for uma URI local, faça o upload para o Supabase
    if (imageUrlToUpload && imageUrlToUpload.startsWith('file://')) {
      console.log('📤 Fazendo upload da imagem para Supabase...');
      try {
        const publicUrl = await uploadImageToSupabase(imageUrlToUpload);
        if (publicUrl) {
          imageUrlToUpload = publicUrl;
          console.log('✅ Upload da imagem concluído:', publicUrl);
        } else {
          throw new Error('Falha ao obter a URL pública da imagem');
        }
      } catch (uploadError: any) {
        console.error('❌ Erro no upload:', uploadError.message);
        Alert.alert('Erro', `Falha ao fazer upload da imagem: ${uploadError.message}`);
        setIsSubmitting(false);
        clearTimeout(fallbackTimeout);
        return;
      }
    }

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      imageurl: imageUrlToUpload,
      categoria: data.categoria,
      calorias: data.calorias ?? null,
      tempo_preparo: data.tempo_preparo ?? null,
      gordura: data.gordura ?? null,
      proteina: data.proteina ?? null,
      carboidratos: data.carboidratos ?? null,
    };

    try {
      console.log('=== ENVIANDO DIETA PARA O BACKEND ===');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('URL da imagem final:', imageUrlToUpload);
      console.log('Usuário autenticado:', user?.name);
      console.log('Session ID:', user?.sessionId);
      console.log('Base URL da API:', api.defaults.baseURL);
      console.log('Headers padrão:', api.defaults.headers);
      
      if (initialData?.id_dieta) {
        // Editar dieta existente
        console.log('Editando dieta existente:', initialData.id_dieta);
        const response = await api.put(`/dietas/${initialData.id_dieta}`, payload, {
          headers: {
            Authorization: `Bearer ${user.sessionId}`,
          },
        });
        console.log('✅ Resposta da API (editar):', response.data);
        Alert.alert('Sucesso', 'Dieta atualizada com sucesso!');
      } else {
        // Criar nova dieta
        console.log('📝 Criando nova dieta');
        console.log('URL completa:', `${api.defaults.baseURL}/dietas`);
        console.log('Iniciando requisição POST...');
        
        const response = await api.post('/dietas', payload, {
          headers: {
            Authorization: `Bearer ${user.sessionId}`,
          },
          timeout: 15000, // 15 segundos de timeout
        });
        console.log('✅ Resposta da API (criar):', response.data);
        Alert.alert('Sucesso', 'Dieta criada com sucesso!');
      }
      
      // Chamar callback de sucesso para atualizar a lista
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      reset();
    } catch (error: any) {
      console.error('❌ Erro ao salvar dieta:', error.message);
      let errorMessage = 'Ocorreu um erro ao salvar a dieta.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tempo de conexão esgotado. Verifique sua internet.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Erro de rede. Verifique sua conexão.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Não autorizado. Faça login novamente.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Erro', errorMessage);
    } finally {
      console.log('🔄 Finalizando submit, resetando estado');
      clearTimeout(fallbackTimeout);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      index={sheetIndex}
      onChange={setSheetIndex}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
      enableOverDrag={false}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
      activeOffsetY={[-1, 1]}
      failOffsetX={[-5, 5]}
    >
      <BottomSheetScrollView 
        style={styles.sheetContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
          <Text style={styles.sheetTitle}>{isAddingNewDiet ? 'Adicionar Nova Dieta' : 'Editar Dieta'}</Text>

          <Text style={styles.label}>Nome da Dieta:</Text>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: Salada de Frango"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}

          <Text style={styles.label}>Descrição:</Text>
          <Controller
            control={control}
            name="descricao"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva a dieta..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={4}
              />
            )}
          />
          {errors.descricao && <Text style={styles.errorText}>{errors.descricao.message}</Text>}

          <Text style={styles.label}>Categoria:</Text>
          <Controller
            control={control}
            name="categoria"
            render={({ field: { onChange, value } }) => (
              <SelectInput
                value={value}
                onChange={onChange}
                placeholder="Selecione a categoria"
                options={categoryOptions}
              />
            )}
          />
          {errors.categoria && <Text style={styles.errorText}>{errors.categoria.message}</Text>}

          <Text style={styles.label}>Calorias (kcal):</Text>
          <Controller
            control={control}
            name="calorias"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: 300"
                onBlur={onBlur}
                onChangeText={text => onChange(text === '' ? undefined : Number(text))}
                value={value?.toString() || ''}
                keyboardType="numeric"
              />
            )}
          />
          {errors.calorias && <Text style={styles.errorText}>{errors.calorias.message}</Text>}

          <Text style={styles.label}>Tempo de Preparo (minutos):</Text>
          <Controller
            control={control}
            name="tempo_preparo"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: 30"
                onBlur={onBlur}
                onChangeText={text => onChange(text === '' ? undefined : Number(text))}
                value={value?.toString() || ''}
                keyboardType="numeric"
              />
            )}
          />
          {errors.tempo_preparo && <Text style={styles.errorText}>{errors.tempo_preparo.message}</Text>}

          <Text style={styles.label}>Carboidratos (g):</Text>
          <Controller
            control={control}
            name="carboidratos"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: 40"
                onBlur={onBlur}
                onChangeText={text => onChange(text === '' ? undefined : Number(text))}
                value={value?.toString() || ''}
                keyboardType="numeric"
              />
            )}
          />
          {errors.carboidratos && <Text style={styles.errorText}>{errors.carboidratos.message}</Text>}

          <Text style={styles.label}>Gordura (g):</Text>
          <Controller
            control={control}
            name="gordura"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: 15"
                onBlur={onBlur}
                onChangeText={text => onChange(text === '' ? undefined : Number(text))}
                value={value?.toString() || ''}
                keyboardType="numeric"
              />
            )}
          />
          {errors.gordura && <Text style={styles.errorText}>{errors.gordura.message}</Text>}

          <Text style={styles.label}>Proteína (g):</Text>
          <Controller
            control={control}
            name="proteina"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Ex: 25"
                onBlur={onBlur}
                onChangeText={text => onChange(text === '' ? undefined : Number(text))}
                value={value?.toString() || ''}
                keyboardType="numeric"
              />
            )}
          />
          {errors.proteina && <Text style={styles.errorText}>{errors.proteina.message}</Text>}

          <Text style={styles.label}>Imagem da Dieta:</Text>
          <View style={styles.imagePickerContainer}>
            {imageUri ? (
              <TouchableOpacity onPress={handleImageSelection}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleImageSelection}>
                <View style={styles.imagePlaceholder}>
                  <ImageIcon size={40} color="#ccc" />
                  <Text style={[styles.imagePlaceholderText, { textAlign: 'center' }]}>
                    Tire uma foto{'\n'} ou selecione uma imagem {'\n'}da sua galeria.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          {errors.imageurl && <Text style={styles.errorText}>{errors.imageurl.message}</Text>}

          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity style={[styles.submitButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.submitButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleSubmit(onSubmitForm)}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Espaço extra para garantir que os botões sejam totalmente visíveis */}
          <View style={styles.extraBottomSpace} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerContainer: {
    marginTop: 15,
    marginHorizontal: -16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#6b7280',
    marginTop: 5,
  },
  selectedImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#192126',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    minHeight: 50,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
    marginTop: -5,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: -120,
    paddingHorizontal: 0,
  },
  cancelButton: {
    backgroundColor: '#192126',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  extraBottomSpace: {
    height: 80,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
});

export default DietFormSheet;