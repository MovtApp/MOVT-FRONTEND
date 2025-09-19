import React from 'react'
import { Text, TouchableOpacity, View, Image } from 'react-native'
import { StyleSheet } from 'react-native'

export interface Plan {
    imageUrl: string;
    title: string;
    description: string;
    sets: string;
    calories: string;
}

interface PlanCardTrainingProps {
    planData?: Plan[]; 
}

const PlanCardTraining: React.FC<PlanCardTrainingProps> = ({ planData: _propPlanData }) => {
    
    const planData: Plan[] = [
        {
          title: 'Prancha (Plank)',
          description: '20 - 30 segundos por série',
          sets: '3 séries por dia',
          calories: '9 - 18 Kcal',
          imageUrl: 'https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513125/prancha_g1v30x.png',
        },
        {
          title: 'Bicicleta no ar',
          description: '60 segundos por série',
          sets: '3 séries por dia',
          calories: '18 - 24 Kcal',
          imageUrl: 'https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513124/bicicleta_yqrmzr.png',
        },
        {
          title: 'Elevação de pernas',
          description: '60 segundos por série',
          sets: '3 séries por dia',
          calories: '12 - 18 Kcal',
          imageUrl: 'https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513123/elevacao_vufoer.png',
        },
    ];
    
    return (
        <View style={styles.section}>
            {/* Plano de hoje */}
            <Text style={styles.sectionTitle}>Plano de hoje</Text>
            <View style={styles.planCardsContainer}>
                {planData.map((plan, index) => (
                    <TouchableOpacity key={index} style={styles.planCard}>
                        <Image source={{ uri: plan.imageUrl }} style={styles.planCardImage} />
                        <View style={styles.planCardContent}>
                            <Text style={styles.planCardTitle}>{plan.title}</Text>
                            <Text style={styles.planCardDescription}>{plan.description}</Text>
                            <Text style={styles.planCardText}>{plan.sets}</Text>
                            <Text style={styles.planCardText}>{plan.calories}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 16,
    },
    planCardsContainer: {
        marginTop: 10,
      },
      planCard: {
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
      planCardImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 15,
      },
      planCardContent: {
        flex: 1,
      },
      planCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
      },
      planCardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
      },
      planCardText: {
        fontSize: 14,
        color: '#666',
      },
})

export default PlanCardTraining