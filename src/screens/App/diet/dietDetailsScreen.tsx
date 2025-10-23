import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native'
import { ArrowLeft, Clock4, Flame } from 'lucide-react-native'

interface DietDetailsScreenProps {
    route?: { params?: { meal?: any } }
    navigation?: any
}

const DietDetailsScreen: React.FC<DietDetailsScreenProps> = ({ route, navigation }) => {
    const meal = route?.params?.meal || {}
    const description = (
        (meal?.description ?? meal?.details ?? meal?.desc ?? '') as string
    )?.toString?.().trim?.() || ''
    const planItems = Array.isArray(meal?.planMeals)
        ? meal.planMeals
        : Array.isArray(meal?.plan)
        ? meal.plan
        : []

    const goBack = () => {
        if (navigation?.goBack) navigation.goBack()
    }

    return (
        <View style={styles.container}>
            {/* Imagem principal abaixo do botão de back */}
            <View style={styles.heroWrapper}>
                <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#111827" />
                </TouchableOpacity>
                {meal?.imageUrl ? (
                    <Image source={{ uri: meal.imageUrl }} style={styles.heroImage} resizeMode="cover" />
                ) : null}
                {(meal?.calories || meal?.minutes) ? (
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statsItem}>
                                <Flame size={16} color="#111827" />
                                <Text style={styles.statsText}>{meal?.calories || '—'}</Text>
                            </View>

                            <View style={styles.statsDivider} />

                            <View style={styles.statsItem}>
                                <Clock4 size={16} color="#111827" />
                                <Text style={styles.statsText}>{meal?.minutes || '—'}</Text>
                            </View>

                            <View style={styles.statsDivider} />

                            <View style={styles.statsItem}>
                                {meal?.authorAvatar ? (
                                    <Image source={{ uri: meal.authorAvatar }} style={styles.authorAvatar as any} />
                                ) : null}
                                <Text style={styles.statsText}>{meal?.authorName || 'Autor'}</Text>
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

                <View style={styles.content}>
                    <Text style={styles.title}>{meal?.title || 'Refeição'}</Text>

                    <Text style={styles.sectionTitle}>Descrição</Text>
                    <Text style={styles.paragraph}>{description || 'Descrição da refeição'}
                    </Text>

                    <View style={styles.macroCard}>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Gordura</Text>
                            <Text style={styles.macroValue}>{meal?.fat}</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Proteína</Text>
                            <Text style={styles.macroValue}>{meal?.protein}</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Carboidrato</Text>
                            <Text style={styles.macroValue}>{meal?.carbs}</Text>
                        </View>
                    </View>

                    <View style={styles.statsDivider} />

                    {/* Plano de refeições */}
                    {planItems?.length ? (
                        <>
                            <Text style={styles.sectionTitle}>Plano de refeições</Text>
                            <View style={styles.planList}>
                                {planItems.map((item: any, idx: number) => {
                                    const itemFat = item?.fat ?? meal?.fat ?? '—'
                                    const itemProtein = item?.protein ?? meal?.protein ?? '—'
                                    const itemCarbs = item?.carbs ?? meal?.carbs ?? '—'
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.planCard}
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                if (navigation?.push) {
                                                    navigation.push('DietDetails', { meal: { ...meal, ...item } })
                                                } else if (navigation?.navigate) {
                                                    navigation.navigate('DietDetails', { meal: { ...meal, ...item } })
                                                }
                                            }}
                                        >
                                            <View style={styles.planRow}>
                                                {item?.imageUrl ? (
                                                    <Image source={{ uri: item.imageUrl }} style={styles.planImage} />
                                                ) : (
                                                    <View style={[styles.planImage, styles.planImagePlaceholder]} />
                                                )}
                                                <View style={styles.planInfo}>
                                                    <Text style={styles.planTitle} numberOfLines={2}>
                                                        {item?.title || 'Refeição do plano'}
                                                    </Text>
                                                    <View style={styles.planMacrosRow}>
                                                        <View style={styles.planMacroItem}>
                                                            <Text style={styles.planMacroLabel}>Gordura</Text>
                                                            <Text style={styles.planMacroValue}>{itemFat}</Text>
                                                        </View>
                                                        <View style={styles.planMacroItem}>
                                                            <Text style={styles.planMacroLabel}>Proteína</Text>
                                                            <Text style={styles.planMacroValue}>{itemProtein}</Text>
                                                        </View>
                                                        <View style={styles.planMacroItem}>
                                                            <Text style={styles.planMacroLabel}>Carboidrato</Text>
                                                            <Text style={styles.planMacroValue}>{itemCarbs}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                            {idx !== planItems.length - 1 ? <View style={styles.planDivider} /> : null}
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </>
                    ) : null}
                    
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#BBF246',
        zIndex: 1000,
        marginTop: 30,
        marginLeft: 30
    },
    headerTitle: { 
        color: '#111827', 
        fontSize: 16, 
        fontWeight: '700' 
    },
    heroWrapper: { 
        position: 'relative' 
    },
    heroImage: { 
        width: '100%', 
        height: 240, 
        marginTop: -80 
    },
    statsCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: -28,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    statsRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-evenly' 
    },
    statsItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 as any 
    },
    statsDivider: { 
        width: 1, 
        height: 20, 
        backgroundColor: '#E5E7EB' 
    },
    statsText: { 
        color: '#111827', 
        fontSize: 14, 
        fontWeight: 'semibold' 
    },
    content: { 
        paddingHorizontal: 20, 
        paddingTop: 44 
    },
    title: { 
        color: '#111827', 
        fontSize: 18, 
        fontWeight: '800', 
        marginBottom: 8 
    },
    authorRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 8 as any, 
        marginBottom: 12 
    },
    authorAvatar: { 
        width: 22, 
        height: 22, 
        borderRadius: 11 
    },
    authorName: { 
        color: '#6b7280', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    metaRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 as any, 
        marginBottom: 16 
    },
    metaItem: { 
        flexDirection: 'row',
        alignItems: 'center', 
        gap: 6 as any 
    },
    metaSeparator: { 
        width: 1, 
        height: 16, 
        backgroundColor: '#E5E7EB' 
    },
    metaText: { 
        color: '#111827', 
        fontSize: 13, 
        fontWeight: '600' 
    },
    sectionTitle: { 
        color: '#111827', 
        fontSize: 16, 
        fontWeight: '700', 
        marginTop: 8, 
        marginBottom: 6 
    },
    paragraph: { 
        color: '#4b5563', 
        fontSize: 14, 
        lineHeight: 20 
    },
    macroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
        marginTop: 10,
    },
    macroItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2 as any,
    },
    macroDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.18)'
    },
    macroLabel: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        marginBottom: 2,
    },
    macroValue: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
        opacity: 0.9,
    },
    planList: {
        marginTop: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    planCard: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    planRow: {
        flexDirection: 'row',
        gap: 12 as any,
        alignItems: 'center',
    },
    planImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    planImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    planInfo: {
        flex: 1,
    },
    planTitle: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    planMacrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    planMacroItem: {
        flex: 1,
    },
    planMacroLabel: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    planMacroValue: {
        color: '#111827',
        fontSize: 13,
        fontWeight: '700',
    },
    planDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 12,
    },
})

export default DietDetailsScreen
