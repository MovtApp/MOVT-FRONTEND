import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { userService } from "@services/userService";
import { useAuth } from "@contexts/AuthContext";

const { height } = Dimensions.get("window");

interface User {
    id: number;
    name: string;
    username: string;
    photo: string | null;
    isFollowing: boolean;
}

interface FollowListModalProps {
    visible: boolean;
    type: "followers" | "following" | null;
    userId: number | string;
    onClose: () => void;
    onUserPress: (user: User) => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({
    visible,
    type,
    userId,
    onClose,
    onUserPress,
}) => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingStates, setFollowingStates] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        if (visible && type && userId) {
            loadUsers();
        }
    }, [visible, type, userId]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response =
                type === "followers"
                    ? await userService.getUserFollowers(String(userId))
                    : await userService.getUserFollowing(String(userId));

            if (response.success) {
                setUsers(response.data);
                // Initialize following states
                const states: { [key: number]: boolean } = {};
                response.data.forEach((user: User) => {
                    states[user.id] = user.isFollowing;
                });
                setFollowingStates(states);
            }
        } catch (error) {
            console.error("Erro ao carregar lista:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (user: User) => {
        try {
            const isCurrentlyFollowing = followingStates[user.id];

            // Optimistic update
            setFollowingStates((prev) => ({
                ...prev,
                [user.id]: !isCurrentlyFollowing,
            }));

            if (isCurrentlyFollowing) {
                await userService.unfollowUser(String(user.id));
            } else {
                await userService.followUser(String(user.id));
            }
        } catch (error) {
            console.error("Erro ao seguir/deixar de seguir:", error);
            // Revert on error
            setFollowingStates((prev) => ({
                ...prev,
                [user.id]: !prev[user.id],
            }));
        }
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isFollowing = followingStates[item.id];
        const DEFAULT_AVATAR =
            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop";

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => onUserPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.userInfo}>
                    <Image
                        source={{ uri: item.photo || DEFAULT_AVATAR }}
                        style={styles.avatar}
                    />
                    <View style={styles.userText}>
                        <Text style={styles.userName}>{item.name}</Text>
                    </View>
                </View>

                {String(item.id) !== String(authUser?.id) && (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            isFollowing && styles.followingButton,
                        ]}
                        onPress={() => handleFollowToggle(item)}
                    >
                        <Text
                            style={[
                                styles.followButtonText,
                                isFollowing && styles.followingButtonText,
                            ]}
                        >
                            {isFollowing ? "Seguindo" : "Seguir"}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
                {type === "followers"
                    ? "Nenhum seguidor ainda"
                    : "Não está seguindo ninguém"}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {type === "followers" ? "Seguidores" : "Seguindo"}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#64748B" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#CBFB5E" />
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => String(item.id)}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={renderEmptyState}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: height * 0.75,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1E293B",
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginHorizontal: 24,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E2E8F0",
    },
    userText: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E293B",
    },
    followButton: {
        backgroundColor: "#1E293B",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 90,
        alignItems: "center",
    },
    followingButton: {
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    followButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    followingButtonText: {
        color: "#1E293B",
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#94A3B8",
    },
});

export default FollowListModal;
