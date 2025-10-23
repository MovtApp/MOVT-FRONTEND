import React from 'react'
import { Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native'

export interface Heating {
    imageUrl: string;
    title: string;
    level: string;
    minutes: string;
    id: string; // Adicionado o id para usar como key
}

const heatingData: Heating[] = [
    {
      id: '1',
      title: 'Mobilidade',
      level: 'Iniciante',
      minutes: '10 min',
      imageUrl: 'https://img.freepik.com/free-photo/close-up-diversity-sport-woman-training_23-2149174755.jpg?t=st=1758304427~exp=1758308027~hmac=41581cca3f5711388c58aa44f0a34ae2987db489977a6a44f18ae8cf1f8dc66d&w=1060',
    },
    {
      id: '2',
      title: 'Cárdio na Esteira',
      level: 'Iniciante',
      minutes: '15 min',
      imageUrl: 'https://img.freepik.com/free-photo/young-adult-doing-indoor-sport-gym_23-2149205553.jpg?t=st=1758304525~exp=1758308125~hmac=0b7e81fe45e19678de8a25feb63f9ec4b1cbb193d17d2718643d65ff5403e21f&w=1060',
    },
    {
      id: '3',
      title: 'Elevação de pernas',
      level: '3 séries por dia',
      minutes: '12 - 18 Kcal',
      imageUrl: 'https://img.freepik.com/free-photo/side-view-determined-young-woman-holding-slam-ball-with-her-legs-doing-abdominal-crunches-have-flat-abs_662251-1367.jpg?t=st=1758304715~exp=1758308315~hmac=28cd720f804c7bf649b7d575084bd3812f74fb786d8df1daf0da95a43b182eef&w=1480',
    },
    {
      id: '4',
      title: 'Alongamento de Tronco',
      level: 'Iniciante',
      minutes: '8 min',
      imageUrl: 'https://img.freepik.com/free-photo/sportswoman-stretching-muscles-making-functional-training-makes-slope_1153-6338.jpg?t=st=1758304747~exp=1758308347~hmac=1821798d962d2806fbbdc5c1d71c754040724c29b67b564041bd4e9f247e08bd&w=1480',
    },
    {
      id: '5',
      title: 'Rotação de Braços',
      level: 'Iniciante',
      minutes: '7 min',
      imageUrl: 'https://img.freepik.com/free-photo/woman-training-athletics_52683-151583.jpg?t=st=1758304782~exp=1758308382~hmac=5e8a066b793881320834eafcef5101f37b41c0bdec6b069bac02759b3828c825&w=1480',
    },
];

interface HeatingScreenProps {
    heatingData?: Heating[]; 
}

const HeatingScreen: React.FC<HeatingScreenProps> = ({ heatingData: _propheatingData }) => {
    
    return (
        <View style={styles.section}>
            {/* heatingo de hoje */}
            <Text style={styles.sectionTitle}>Aquecimento rápido</Text>
            <View style={styles.heatingCardsContainer}>
                {heatingData.map((heating) => (
                    <TouchableOpacity key={heating.id} style={styles.heatingCard}>
                        <Image source={{ uri: heating.imageUrl }} style={styles.heatingCardImage} />
                        <View style={styles.heatingCardContent}>
                            <Text style={styles.heatingCardTitle}>{heating.title}</Text>
                            <Text style={styles.heatingCardText}>{heating.level}</Text>
                            <Text style={styles.heatingCardText}>{heating.minutes}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 100,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 16,
    },
    heatingCardsContainer: {
        marginTop: 10,
      },
      heatingCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
      },
      heatingCardImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 15,
      },
      heatingCardContent: {
        flex: 1,
      },
      heatingCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
      },
      heatingCardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
      },
      heatingCardText: {
        fontSize: 14,
        color: '#666',
      },
})

export default HeatingScreen;