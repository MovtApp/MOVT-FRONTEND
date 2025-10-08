import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, Platform } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface DietFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dietData: any) => void; // Função para enviar os dados da dieta (add ou edit)
  initialData?: any; // Dados iniciais da dieta para edição
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
}

const DietFormSheet: React.FC<DietFormSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  bottomSheetRef,
  sheetIndex,
  setSheetIndex,
}) => {
  const snapPoints = useMemo(() => ['70%', '90%'], []);
  const [nome, setNome] = useState(initialData?.title || '');
  const [descricao, setDescricao] = useState(initialData?.description || '');
  const [calorias, setCalorias] = useState(initialData?.calories?.replace(' kcal', '') || '');
  const [tempoPreparo, setTempoPreparo] = useState(initialData?.minutes?.replace(' min', '') || '');
  const [gordura, setGordura] = useState(initialData?.fat?.replace(' g', '') || '');
  const [proteina, setProteina] = useState(initialData?.protein?.replace(' g', '') || '');
  const [carboidratos, setCarboidratos] = useState(initialData?.carbs?.replace(' g', '') || '');
  const [nomeAutor, setNomeAutor] = useState(initialData?.authorName || '');
  const [avatarAutorUrl, setAvatarAutorUrl] = useState(initialData?.authorAvatar || '');
  const [imageUri, setImageUri] = useState(initialData?.imageUrl || null);

  useEffect(() => {
    if (initialData) {
      setNome(initialData.title || '');
      setDescricao(initialData.description || '');
      setCalorias(initialData.calories?.replace(' kcal', '') || '');
      setTempoPreparo(initialData.minutes?.replace(' min', '') || '');
      setGordura(initialData.fat?.replace(' g', '') || '');
      setProteina(initialData.protein?.replace(' g', '') || '');
      setCarboidratos(initialData.carbs?.replace(' g', '') || '');
      setNomeAutor(initialData.authorName || '');
      setAvatarAutorUrl(initialData.authorAvatar || '');
      setImageUri(initialData.imageUrl || null);
    } else {
      // Limpar formulário quando não há initialData (modo de adição)
      setNome('');
      setDescricao('');
      setCalorias('');
      setTempoPreparo('');
      setGordura('');
      setProteina('');
      setCarboidratos('');
      setNomeAutor('');
      setAvatarAutorUrl('');
      setImageUri(null);
    }
  }, [initialData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos da sua permissão para acessar a galeria de imagens para que isso funcione!'
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos da sua permissão para acessar a câmera para que isso funcione!'
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da dieta é obrigatório.');
      return;
    }
    // Adicione validações para outros campos importantes aqui

    onSubmit({
      id_dieta: initialData?.id_dieta, // Passa o ID se for edição
      nome: nome.trim(),
      descricao: descricao.trim(),
      calorias: calorias ? parseFloat(calorias) : 0,
      tempo_preparo: tempoPreparo ? parseInt(tempoPreparo) : 0,
      gordura: gordura ? parseFloat(gordura) : 0,
      proteina: proteina ? parseFloat(proteina) : 0,
      carboidratos: carboidratos ? parseFloat(carboidratos) : 0,
      nome_autor: nomeAutor.trim(),
      avatar_autor_url: avatarAutorUrl.trim(),
      imageurl: imageUri, // A URL da imagem ou base64, dependendo de como você fará o upload
    });
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
    >
      <BottomSheetView style={styles.sheetContent}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sheetTitle}>{initialData ? 'Editar Dieta' : 'Adicionar Nova Dieta'}</Text>

          {/* Campos do Formulário */}
          <Text style={styles.label}>Nome da Dieta:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Salada de Frango"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Descrição:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva a dieta..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Calorias (kcal):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 350"
            keyboardType="numeric"
            value={calorias}
            onChangeText={setCalorias}
          />

          <Text style={styles.label}>Tempo de Preparo (min):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 30"
            keyboardType="numeric"
            value={tempoPreparo}
            onChangeText={setTempoPreparo}
          />

          <Text style={styles.label}>Gordura (g):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10.5"
            keyboardType="numeric"
            value={gordura}
            onChangeText={setGordura}
          />

          <Text style={styles.label}>Proteína (g):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 25"
            keyboardType="numeric"
            value={proteina}
            onChangeText={setProteina}
          />

          <Text style={styles.label}>Carboidratos (g):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 40"
            keyboardType="numeric"
            value={carboidratos}
            onChangeText={setCarboidratos}
          />

          <Text style={styles.label}>Nome do Autor:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Chef Saudável"
            value={nomeAutor}
            onChangeText={setNomeAutor}
          />

          <Text style={styles.label}>URL do Avatar do Autor:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: https://example.com/avatar.jpg"
            value={avatarAutorUrl}
            onChangeText={setAvatarAutorUrl}
          />

          {/* Área de Imagem */}
          <Text style={styles.label}>Imagem da Dieta:</Text>
          <View style={styles.imagePickerContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={40} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Nenhuma imagem selecionada</Text>
              </View>
            )}
            <View style={styles.imagePickerButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <ImageIcon size={24} color="#111827" />
                <Text style={styles.iconButtonText}>Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
                <Camera size={24} color="#111827" />
                <Text style={styles.iconButtonText}>Câmera</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{initialData ? 'Salvar Alterações' : 'Adicionar Dieta'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
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
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40, // Espaço extra para o botão de enviar não ficar escondido
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
    marginTop: 10,
    marginBottom: 5,
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
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
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
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 10, // Usando gap para espaçamento
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BBF246',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8, // Espaçamento entre ícone e texto
  },
  iconButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default DietFormSheet;
