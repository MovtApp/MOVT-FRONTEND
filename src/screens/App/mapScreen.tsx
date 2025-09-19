import React, { useEffect, useState } from 'react'
import { Text, View, Platform } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'

const MapScreen: React.FC = () => {
    const [location, setLocation] = useState<{ latitude: number; longitude: number; } | null>(null);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                getCurrentLocation();
            } else {
                console.log('Permissão de localização negada');
            }
        }
    };

    const getCurrentLocation = () => {
        Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 1000 },
            (loc: Location.LocationObject) => {
                if (loc.coords.latitude && loc.coords.longitude) {
                    setLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    });
                }
            }
        );
    };

    if (!location) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Carregando localização...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                followsUserLocation={true}
                showsCompass={false}
                toolbarEnabled={false}
                zoomControlEnabled={false}
            >
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="Sua Localização"
                    description="Você está aqui"
                />
            </MapView>
        </View>
    )
}

export default MapScreen;