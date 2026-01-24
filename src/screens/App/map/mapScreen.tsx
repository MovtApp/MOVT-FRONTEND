import React, { useRef, useState, useEffect } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import TrainingSelector from "@components/TrainingSelector";
import { DetailsBottomSheet, PersonalTrainer } from "@components/DetailsBottomSheet";
import { MapSettingSheet } from "@components/MapSettingSheet";
import { GymCard } from "@components/GymCard";
import BottomSheet from "@gorhom/bottom-sheet";
import { Globe, Settings2, MapPin, LocateFixed } from "lucide-react-native";
import { useLocationContext } from "@contexts/LocationContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { getNearbyGyms, Gym } from "@services/gymService";
import { useAuth } from "@contexts/AuthContext";
import { Animated, Easing } from "react-native";

const CustomGymMarker = ({ selected }: { selected: boolean }) => {
  const mainColor = selected ? "#059669" : "#B1F232";
  return (
    <View style={markerStyles.container}>
      {/* Camada de Borda Branca Exterior */}
      <MapPin
        size={44}
        color="#fff"
        fill="#fff"
        style={{ position: 'absolute' }}
      />
      {/* Camada Colorida Interna */}
      <MapPin
        size={34}
        color={mainColor}
        fill={mainColor}
      />
      {/* Ponto Branco Central */}
      <View style={markerStyles.innerDot} />
    </View>
  );
};

const MapScreen: React.FC = () => {
  const { location, refreshLocation } = useLocationContext();
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(1);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handleTrainerPress = (trainer: PersonalTrainer) => {
    // Navigate to the ProfilePJScreen with the trainer data
    navigation.navigate("ProfilePJ", { trainer });
  };
  const handleViewSelected = (trainers: PersonalTrainer[]) => {
    if (!trainers || trainers.length === 0) return;
    navigation.navigate("SelectedTrainers", { trainers });
  };

  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [mapSheetIndex, setMapSheetIndex] = useState(0);
  const mapBottomSheetRef = useRef<BottomSheet>(null);

  // Estados para as configurações do mapa
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">(
    "standard"
  );
  const [showsUserLocation, setShowsUserLocation] = useState(true);
  const [showsCompass, setShowsCompass] = useState(false);
  const [displayRadiusKm, setDisplayRadiusKm] = useState(50); // Valor inicial em 50Km para abranger mais áreas
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Estados para academias
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [loadingGyms, setLoadingGyms] = useState(false);

  // Timeout para evitar tempo de carregamento infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 segundos de timeout

    return () => clearTimeout(timeout);
  }, []);

  // Buscar academias próximas quando a localização estiver disponível
  useEffect(() => {
    if (location && user?.sessionId) {
      fetchNearbyGyms();

      // Centraliza o mapa no usuário suavemente na primeira vez ou se estiver seguindo
      if (location && showsUserLocation) {
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: latitudeDelta,
          longitudeDelta: longitudeDelta,
        }, 1000);
      }
    }
  }, [location?.latitude, location?.longitude, user, displayRadiusKm]);

  const fetchNearbyGyms = async () => {
    if (!location || !user?.sessionId) return;

    try {
      setLoadingGyms(true);
      const response = await getNearbyGyms(
        location.latitude,
        location.longitude,
        displayRadiusKm,
        user.sessionId
      );
      console.log("📍 Academias próximas encontradas:", response.data?.length || 0);
      setGyms(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar academias:", error);
      setGyms([]);
    } finally {
      setLoadingGyms(false);
    }
  };

  const handleGymPress = (gym: Gym) => {
    if (selectedGym?.id_academia === gym.id_academia) {
      setSelectedGym(null);
    } else {
      setSelectedGym(gym);
    }
  };

  const handleCloseGymCard = () => {
    setSelectedGym(null);
  };

  // Calcula os deltas com base no raio de exibição
  const latitudeDelta = location ? (displayRadiusKm * 2) / 111.32 : 0.0421; // Valor padrão se location for nulo
  const longitudeDelta = location
    ? (displayRadiusKm * 2) / (111.32 * Math.cos((location.latitude * Math.PI) / 180))
    : 0.0421; // Valor padrão se location for nulo

  // Dados de exemplo para os personal trainers
  const sampleTrainers = [
    {
      id: "1",
      name: "Oliver Augusto",
      description:
        "Oliver Augusto personal trainer especializado em musculação, com 5 anos de experiência. Ele tem como objetivo ajudar seus alunos a alcançar resultados consistentes através de treinos personalizados, sempre respeitando os limites e necessidades de cada um.",
      rating: 1290,
      imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_qbpvr6.jpg",
    },
    {
      id: "2",
      name: "Hector Oliveira",
      description:
        "Hector Oliveira é um personal trainer apaixonado pela musculação, com foco em hipertrofia e aumento de força. Com sua abordagem motivacional e desafiadora, ele ajuda seus alunos a superarem seus limites e atingirem seu máximo potencial físico.",
      rating: 911,
      imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_1_m2bivq.jpg",
    },
    {
      id: "3",
      name: "Cláudio Matias",
      description:
        "Cláudio Matias é um personal trainer especializado em musculação e treinamento de força. Com mais de 7 anos de experiência, ele desenvolve programas de treino focados no aumento de força e resistência muscular.",
      rating: 523,
      imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_2_kgtuno.jpg",
    },
    {
      id: "4",
      name: "Andressa Fontinelle",
      description:
        "Andressa Fontinelle é personal trainer especializada em musculação, com foco no aumento de força e resistência.",
      rating: 512,
      imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_3_fjkzrx.jpg",
    },
    {
      id: "5",
      name: "Bruna Carvalho",
      description:
        "Ela é especializada em criar treinos que desafiem seus alunos, sempre com foco na segurança e evolução gradual.",
      rating: 228,
      imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757838100/image_4_s7pm2j.jpg",
    },
  ];

  // Localização agora é provida pelo LocationProvider em nível de app

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
    bottomSheetRef.current?.expand();
  };

  const handleOpenMapSheet = () => {
    setIsMapSheetOpen(true);
    mapBottomSheetRef.current?.expand();
  };

  // Tenta obter a localização novamente se estiver demorando
  const handleRetryLocation = () => {
    setLoadingTimeout(false);
    refreshLocation();
  };

  // Usa uma localização padrão se demorar muito para carregar
  const defaultLocation = {
    latitude: -3.7184,
    longitude: -38.5434,
  };

  // Mostra o carregamento apenas se não tiver timeout e não tiver localização
  const shouldShowLoading = !loadingTimeout && !location;

  // Efeito para tentar carregar a localização quando o componente montar
  useEffect(() => {
    if (!location) {
      // Apenas tenta obter a localização se ainda não tiver
      const loadLocation = async () => {
        // Espera um pouco e depois tenta obter a localização novamente
        setTimeout(() => {
          if (!location && !loadingTimeout) {
            refreshLocation();
          }
        }, 1000);
      };
      loadLocation();
    }
  }, [location, loadingTimeout, refreshLocation]);

  return (
    <View style={{ flex: 1 }}>
      {shouldShowLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Carregando localização...</Text>
          <TouchableOpacity onPress={handleRetryLocation} style={{ marginTop: 10 }}>
            <Text style={{ color: "#007AFF" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location?.latitude || defaultLocation.latitude,
            longitude: location?.longitude || defaultLocation.longitude,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
          }}
          showsUserLocation={showsUserLocation}
          followsUserLocation={true}
          showsCompass={showsCompass}
          toolbarEnabled={false}
          zoomControlEnabled={false}
          mapType={mapType}
          loadingEnabled={true} // Mostra indicador de carregamento do mapa enquanto renderiza
          loadingBackgroundColor="#FFFFFF"
          loadingIndicatorColor="#666666"
          showsMyLocationButton={false}
        >


          {/* Markers das academias */}
          {gyms.map((gym) => (
            <Marker
              key={gym.id_academia}
              coordinate={{
                latitude: gym.latitude,
                longitude: gym.longitude,
              }}
              onPress={(e) => {
                e.stopPropagation(); // Impede que o toque bubble para o mapa
                handleGymPress(gym);
              }}
              anchor={{ x: 0.5, y: 1 }} // Define a ponta do pin como o ponto exato de geolocalização
            >
              <CustomGymMarker selected={selectedGym?.id_academia === gym.id_academia} />
            </Marker>
          ))}
        </MapView>
      )}

      <View
        style={{
          position: "absolute",
          top: 40,
          left: 20,
          right: 0,
          backgroundColor: "transparent",
          marginLeft: 10,
        }}
      >
        <TrainingSelector />
      </View>
      <View
        style={{
          position: "absolute",
          top: 100,
          right: 20,
        }}
      >
        <TouchableOpacity
          onPress={handleOpenSheet}
          activeOpacity={0.8}
          style={{
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Globe size={30} color="#192126" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenMapSheet}
          activeOpacity={0.8}
          style={{
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings2 size={30} color="#192126" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (location) {
              mapRef.current?.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: latitudeDelta,
                longitudeDelta: longitudeDelta,
              }, 1000);
            }
          }}
          activeOpacity={0.8}
          style={{
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LocateFixed size={30} color="#192126" />
        </TouchableOpacity>
      </View>
      <DetailsBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        bottomSheetRef={bottomSheetRef}
        title="Encontre profissionais perto de você!"
        trainers={sampleTrainers}
        isLoading={false}
        sheetIndex={sheetIndex}
        setSheetIndex={setSheetIndex}
        onTrainerPress={handleTrainerPress}
        onViewSelected={handleViewSelected}
      />
      <MapSettingSheet
        isOpen={isMapSheetOpen}
        onClose={() => setIsMapSheetOpen(false)}
        bottomSheetRef={mapBottomSheetRef}
        sheetIndex={mapSheetIndex}
        setSheetIndex={setMapSheetIndex}
        mapType={mapType}
        onMapTypeChange={setMapType}
        showsUserLocation={showsUserLocation}
        onShowsUserLocationChange={setShowsUserLocation}
        showsCompass={showsCompass}
        onShowsCompassChange={setShowsCompass}
        displayRadiusKm={displayRadiusKm}
        onDisplayRadiusKmChange={setDisplayRadiusKm}
      />

      {/* Card de Academia */}
      {selectedGym && (
        <View style={gymCardStyles.container}>
          <GymCard gym={selectedGym} />
        </View>
      )}
    </View>
  );
};

const gymCardStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90, // Aumentado para 160 para subir o card e limpar a BottomNavigationBar
    left: 20,
    right: 20,
    zIndex: 999, // Garantindo que fique acima de tudo
  },
});

const markerStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 38, // Reduzido de 44 para 38 (hitbox mais precisa)
    height: 48, // Ajustado para a altura do Pin (maior para a ponta)
  },
  innerDot: {
    position: "absolute",
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
});

export default MapScreen;
