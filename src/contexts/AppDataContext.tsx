import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Training, DietMeal, Community } from "../@types/routes";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

interface AppDataContextData {
  trainings: Training[];
  loadingTrainings: boolean;
  dailyPlans: any[];
  loadingDailyPlans: boolean;
  communities: Community[];
  loadingCommunities: boolean;
  dietMeals: DietMeal[];
  loadingDietMeals: boolean;
  stripePlans: any[];
  loadingStripePlans: boolean;
  feedPosts: any[];
  loadingFeedPosts: boolean;
  feedDiets: any[];
  loadingFeedDiets: boolean;
  adminDashboardData: any | null;
  loadingAdminDashboard: boolean;
  adminUsers: any[];
  setAdminUsers: React.Dispatch<React.SetStateAction<any[]>>;
  adminTrainers: any[];
  setAdminTrainers: React.Dispatch<React.SetStateAction<any[]>>;
  adminGyms: any[];
  setAdminGyms: React.Dispatch<React.SetStateAction<any[]>>;
  fetchHomeData: (specialty?: string | null, force?: boolean) => Promise<void>;
  fetchDietMeals: (category?: string) => Promise<void>;
  fetchCommunities: (category?: string) => Promise<void>;
  fetchStripePlans: () => Promise<void>;
  fetchFeedData: () => Promise<void>;
  fetchAdminDashboardData: (force?: boolean, tab?: string, status?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextData>({} as AppDataContextData);

const TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);

  const [dailyPlans, setDailyPlans] = useState<any[]>([]);
  const [loadingDailyPlans, setLoadingDailyPlans] = useState(false);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const [dietMeals, setDietMeals] = useState<DietMeal[]>([]);
  const [loadingDietMeals, setLoadingDietMeals] = useState(false);

  const [stripePlans, setStripePlans] = useState<any[]>([]);
  const [loadingStripePlans, setLoadingStripePlans] = useState(false);

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeedPosts, setLoadingFeedPosts] = useState(false);
  const [feedDiets, setFeedDiets] = useState<any[]>([]);
  const [loadingFeedDiets, setLoadingFeedDiets] = useState(false);

  const [adminDashboardData, setAdminDashboardData] = useState<any | null>(null);
  const [loadingAdminDashboard, setLoadingAdminDashboard] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminTrainers, setAdminTrainers] = useState<any[]>([]);
  const [adminGyms, setAdminGyms] = useState<any[]>([]);

  const lastFetch = useRef<Record<string, number>>({});

  // Helper para salvar cache no disco
  const saveCache = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(
        `@MOVT:cache:${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error(`Erro ao salvar cache ${key}:`, e);
    }
  }, []);

  // Helper para carregar cache do disco
  const loadCache = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(`@MOVT:cache:${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error(`Erro ao carregar cache ${key}:`, e);
    }
    return null;
  }, []);

  const shouldFetch = (key: string) => {
    const now = Date.now();
    if (!lastFetch.current[key] || now - lastFetch.current[key] > TTL_MS) {
      lastFetch.current[key] = now;
      return true;
    }
    return false;
  };

  // --- HELPER DE SANITIZAÇÃO ---
  const sanitizeList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => {
      if (!item) return item;
      return {
        ...item,
        nome: item.nome || item.name || "",
        email: item.email || "",
        plan: item.plan || item.plano || "FREE",
        plano: item.plano || item.plan || "FREE",
        role: item.role || item.tipo || item.role_name || "client_pf",
        status: item.status || (item.ativo ? "active" : "blocked"),
        label: item.label || item.nome || "",
      };
    });
  };

  const sanitizeAdminStats = (data: any) => {
    if (!data) return data;
    const sanitized = { ...data };
    if (Array.isArray(sanitized.statusDistribution)) {
      sanitized.statusDistribution = sanitized.statusDistribution.map((d: any) => ({
        ...d,
        label: d.label || "",
        count: Number(d.count || 0),
      }));
    }
    if (Array.isArray(sanitized.planDistribution)) {
      sanitized.planDistribution = sanitized.planDistribution.map((d: any) => ({
        ...d,
        label: d.label || "",
        count: Number(d.count || 0),
      }));
    }
    return sanitized;
  };

  const fetchHomeData = useCallback(
    async (specialty: string | null = null, force = false) => {
      if (!user?.sessionId || user?.isPendingSync) return;

      // Se não for forçado e o cache for recente, não busca
      if (!force && !shouldFetch(`home-${specialty || "all"}`)) return;

      try {
        if (trainings.length === 0) setLoadingTrainings(true);
        if (dailyPlans.length === 0) setLoadingDailyPlans(true);

        const [trResp, dailyResp] = await Promise.all([
          api.get("/treinos", { params: { specialty } }),
          api.get("/treinos", { params: { isDaily: true } }),
        ]);

        const trList = trResp.data.data || trResp.data;
        if (Array.isArray(trList)) {
          const mapped = trList.map((t: any) => ({
            id_treino: String(t.id_treino || t.id),
            id: String(t.id_treino || t.id),
            title: t.nome || t.title,
            calories: t.calorias || t.calories,
            minutes: t.duracao || t.minutes,
            imageUrl:
              t.imageurl ||
              t.image_url ||
              "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
            ...t,
          }));
          setTrainings(mapped);
          saveCache(`trainings-${specialty || "all"}`, mapped);
        }

        const dailyList = dailyResp.data.data || dailyResp.data;
        if (Array.isArray(dailyList)) {
          const mapped = dailyList.map((t: any) => ({
            id_treino: String(t.id_treino || t.id),
            id: String(t.id_treino || t.id),
            title: t.nome || t.title,
            description: t.descricao || t.description || t.duracao || t.minutes,
            sets: t.sets || "3 séries",
            calories: t.calorias || t.calories,
            category: t.categoria || t.category || "Fitness",
            imageUrl:
              t.imageurl ||
              t.image_url ||
              "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757513125/prancha_g1v30x.png",
            ...t,
          }));
          setDailyPlans(mapped);
          saveCache("dailyPlans", mapped);
        }
      } catch (error) {
        console.error("Erro AppDataContext (Home):", error);
      } finally {
        setLoadingTrainings(false);
        setLoadingDailyPlans(false);
      }
    },
    [user?.sessionId, saveCache, trainings.length, dailyPlans.length]
  );

  const fetchCommunities = useCallback(
    async (category: string = "Todas", force = false) => {
      if (!user?.sessionId || user?.isPendingSync) return;
      if (!force && !shouldFetch(`communities-${category}`)) return;

      try {
        if (communities.length === 0) setLoadingCommunities(true);
        const { listCommunities } = await import("../services/communityService");
        const data = await listCommunities(user.sessionId, category);
        let formattedData: Community[] = [];
        if (Array.isArray(data)) {
          formattedData = data;
        } else if (data && Array.isArray(data.data)) {
          formattedData = data.data;
        }
        setCommunities(formattedData);
        saveCache(`communities-${category}`, formattedData);
      } catch (error) {
        console.error("Erro AppDataContext (Communities):", error);
      } finally {
        setLoadingCommunities(false);
      }
    },
    [user?.sessionId, saveCache, communities.length]
  );

  const fetchDietMeals = useCallback(
    async (category: string = "all", force = false) => {
      if (!user?.sessionId || user?.isPendingSync) return;
      if (!force && !shouldFetch(`diets-${category}`)) return;

      try {
        if (dietMeals.length === 0) setLoadingDietMeals(true);
        const response = await api.get("/dietas", {
          params: {
            categoria: category === "all" ? undefined : category,
            mine: "true",
          },
        });

        const mappedMeals: DietMeal[] = (response.data.data || []).map((backendMeal: any) => ({
          id: String(backendMeal.id_dieta),
          id_dieta: String(backendMeal.id_dieta),
          title: backendMeal.title || "Sem título",
          calories: backendMeal.calories || "0 kcal",
          minutes: backendMeal.minutes || "0 min",
          imageUrl: backendMeal.imageUrl || "https://via.placeholder.com/150",
          authorName: backendMeal.nome_autor || "Você",
          authorAvatar: backendMeal.avatar_autor_url || "https://via.placeholder.com/30",
          description: backendMeal.description || "",
          fat: backendMeal.fat || "0 g",
          protein: backendMeal.protein || "0 g",
          carbs: backendMeal.carbs || "0 g",
          categoria: backendMeal.categoria || undefined,
          ...backendMeal,
        }));
        setDietMeals(mappedMeals);
        saveCache(`diets-${category}`, mappedMeals);
      } catch (error) {
        console.error("Erro AppDataContext (Diets):", error);
      } finally {
        setLoadingDietMeals(false);
      }
    },
    [user, dietMeals.length, saveCache]
  );

  const fetchStripePlans = useCallback(
    async (force = false) => {
      if (!force && !shouldFetch("stripe-plans")) return;
      try {
        if (stripePlans.length === 0) setLoadingStripePlans(true);
        const response = await axios.get(`${API_URL}/api/plans`);
        setStripePlans(response.data);
        saveCache("stripe-plans", response.data);
      } catch (error) {
        console.error("Erro AppDataContext (Stripe):", error);
      } finally {
        setLoadingStripePlans(false);
      }
    },
    [stripePlans.length, saveCache]
  );

  const fetchFeedData = useCallback(
    async (force = false) => {
      if (!user?.sessionId || user?.isPendingSync) return;
      if (!force && !shouldFetch("feed-data")) return;

      try {
        if (feedPosts.length === 0) setLoadingFeedPosts(true);
        if (feedDiets.length === 0) setLoadingFeedDiets(true);

        const [postsResp, dietsResp] = await Promise.all([
          api.get("/feed", { params: { limit: 10 } }),
          api.get("/dietas", { params: { mine: "false" } }),
        ]);

        const ps = postsResp.data.posts || [];
        setFeedPosts(ps);
        saveCache("feedPosts", ps);

        const mappedFeedDiets = (dietsResp.data.data || []).map((d: any) => ({
          _type: "diet" as const,
          id_dieta: String(d.id_dieta),
          title: d.title || "Sem título",
          description: d.description || "",
          imageUrl: d.imageUrl || "https://via.placeholder.com/600",
          calories: `${d.calories || 0} kcal`,
          minutes: `${d.minutes || 0} min`,
          protein: `${d.protein || 0} g`,
          fat: `${d.fat || 0} g`,
          carbs: `${d.carbs || 0} g`,
          categoria: d.categoria,
          id_us: d.id_us,
          authorName: d.nome_autor || "Você",
          authorAvatar: d.avatar_autor_url || "https://via.placeholder.com/150",
          created_at: d.created_at || new Date().toISOString(),
          likes: d.likes || [],
          likes_count: parseInt(d.likes_count || 0),
          comments_count: parseInt(d.comments_count || 0),
          isLiked: !!d.isLiked,
        }));
        setFeedDiets(mappedFeedDiets);
        saveCache("feedDiets", mappedFeedDiets);
      } catch (error) {
        console.error("Erro AppDataContext (Feed):", error);
      } finally {
        setLoadingFeedPosts(false);
        setLoadingFeedDiets(false);
      }
    },
    [user, feedPosts.length, feedDiets.length, saveCache]
  );

  const fetchAdminDashboardData = useCallback(
    async (force = false, tab = "month", status = "all") => {
      const isAdmin = user?.role === "admin" || (user as any)?.tipo === "admin";
      if (!user?.sessionId || !isAdmin) return;
      if (!force && !shouldFetch(`admin-dashboard-${tab}-${status}`)) return;

      try {
        setLoadingAdminDashboard(true);

        const [statsResp, usersResp, trainersResp, gymsResp] = await Promise.all([
          api.get(`/admin/dashboard-stats`, { params: { tab, period: tab, status } }),
          api.get("/admin/all-users"),
          api.get("/admin/trainers"),
          api.get("/admin/gyms"),
        ]);

        if (statsResp.data.success) {
          const sanitizedStats = sanitizeAdminStats(statsResp.data);
          setAdminDashboardData(sanitizedStats);
          saveCache("adminDashboardData", sanitizedStats);
        }

        const uList = sanitizeList(usersResp.data.users || []);
        setAdminUsers(uList);
        saveCache("adminUsers", uList);

        const tList = sanitizeList(trainersResp.data.users || []);
        setAdminTrainers(tList);
        saveCache("adminTrainers", tList);

        const gList = sanitizeList(gymsResp.data.data || []);
        setAdminGyms(gList);
        saveCache("adminGyms", gList);
      } catch (error) {
        console.error("Erro AppDataContext (AdminFullData):", error);
      } finally {
        setLoadingAdminDashboard(false);
      }
    },
    [user, adminDashboardData, saveCache]
  );

  const refreshAll = useCallback(async () => {
    const isAdmin = user?.role === "admin" || (user as any)?.tipo === "admin";
    const tasks = [
      fetchHomeData(null, true),
      fetchCommunities("Todas", true),
      fetchDietMeals("all", true),
      fetchStripePlans(true),
      fetchFeedData(true),
    ];

    if (isAdmin) {
      tasks.push(fetchAdminDashboardData(true));
    }

    await Promise.allSettled(tasks);
  }, [
    fetchHomeData,
    fetchCommunities,
    fetchDietMeals,
    fetchStripePlans,
    fetchFeedData,
    fetchAdminDashboardData,
    user?.sessionId,
  ]);

  // 1. Carrega o cache offline IMEDIATAMENTE ao inicializar o app (Pre-boot Cache)
  useEffect(() => {
    const initOfflineCache = async () => {
      try {
        const [
          cTrainings,
          cDaily,
          cComm,
          cDiets,
          cStripe,
          cFPosts,
          cFDiets,
          cAdminData,
          cAdminUsers,
          cAdminTrainers,
          cAdminGyms,
        ] = await Promise.all([
          loadCache("trainings-all"),
          loadCache("dailyPlans"),
          loadCache("communities-Todas"),
          loadCache("diets-all"),
          loadCache("stripe-plans"),
          loadCache("feedPosts"),
          loadCache("feedDiets"),
          loadCache("adminDashboardData"),
          loadCache("adminUsers"),
          loadCache("adminTrainers"),
          loadCache("adminGyms"),
        ]);

        if (cTrainings) setTrainings(cTrainings.data);
        if (cDaily) setDailyPlans(cDaily.data);
        if (cComm) setCommunities(cComm.data);
        if (cDiets) setDietMeals(cDiets.data);
        if (cStripe) setStripePlans(cStripe.data);
        if (cFPosts) setFeedPosts(cFPosts.data);
        if (cFDiets) setFeedDiets(cFDiets.data);
        if (cAdminData) setAdminDashboardData(cAdminData.data);
        if (cAdminUsers) setAdminUsers(cAdminUsers.data);
        if (cAdminTrainers) setAdminTrainers(cAdminTrainers.data);
        if (cAdminGyms) setAdminGyms(cAdminGyms.data);
      } catch (err) {
        console.warn("Erro ao inicializar o cache do AppDataContext:", err);
      }
    };
    initOfflineCache();
  }, [loadCache]);

  // 2. Dispara a atualização silenciosa em background assim que a sessão estiver disponível
  useEffect(() => {
    if (user?.sessionId && !user?.isPendingSync) {
      refreshAll();
    }
  }, [user?.sessionId, user?.isPendingSync, refreshAll]);

  return (
    <AppDataContext.Provider
      value={{
        trainings,
        loadingTrainings,
        dailyPlans,
        loadingDailyPlans,
        communities,
        loadingCommunities,
        dietMeals,
        loadingDietMeals,
        stripePlans,
        loadingStripePlans,
        feedPosts,
        loadingFeedPosts,
        feedDiets,
        loadingFeedDiets,
        adminDashboardData,
        loadingAdminDashboard,
        adminUsers,
        setAdminUsers,
        adminTrainers,
        setAdminTrainers,
        adminGyms,
        setAdminGyms,
        fetchHomeData,
        fetchDietMeals,
        fetchCommunities,
        fetchStripePlans,
        fetchFeedData,
        fetchAdminDashboardData,
        refreshAll,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};
