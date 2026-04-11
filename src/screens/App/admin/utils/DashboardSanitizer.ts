import { DashboardData } from "../AdminDashboardScreen";

export const sanitizeDashboardData = (data: any): DashboardData => {
  if (!data) {
    return {
      trainer: { nome: "", avatar_url: null, plan: "" },
      kpis: { totalMonth: 0, pending: 0, upcoming: 0, clients: 0, revenue: 0 },
      revenue: { current: 0, growth: "0%" },
      chartData: [],
      statusDistribution: [],
      appointments: [],
      pending: [],
      clients: [],
      retention: { rate: 0, count: 0, total: 0 },
      churn: { rate: "0", status: "green", count: 0 },
      ltv: { value: 0, arpu: 0 },
      globalStats: { appointments: 0, posts: 0, communities: 0, workouts: 0, admins: 0 },
      planDistribution: [],
      financeKpis: [],
      receiptHistory: [],
      reviews: [],
      strategic: {
        mrr: 0,
        arr: 0,
        growthRate: "+0%",
        projectedRevenue: [],
        topUnits: [],
        engagementScore: 0,
        activeUsersTrend: [],
      },
    };
  }

  return {
    ...data,
    trainer: data.trainer || { nome: "", avatar_url: null, plan: "" },
    kpis: data.kpis || { totalMonth: 0, pending: 0, upcoming: 0, clients: 0, revenue: 0 },
    revenue: data.revenue || { current: 0, growth: "0%" },
    chartData: Array.isArray(data.chartData)
      ? data.chartData.map((d: any) => ({
          label: String(d.label || ""),
          total: Number(d.total || 0),
        }))
      : [],
    statusDistribution: Array.isArray(data.statusDistribution) ? data.statusDistribution : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    pending: Array.isArray(data.pending) ? data.pending : [],
    clients: Array.isArray(data.clients) ? data.clients : [],
    retention: data.retention || { rate: 0, count: 0, total: 0 },
    churn: data.churn || { rate: "0", status: "green", count: 0 },
    ltv: data.ltv || { value: 0, arpu: 0 },
    globalStats: data.globalStats || {
      appointments: 0,
      posts: 0,
      communities: 0,
      workouts: 0,
      admins: 0,
    },
    planDistribution: Array.isArray(data.planDistribution) ? data.planDistribution : [],
    financeKpis: Array.isArray(data.financeKpis) ? data.financeKpis : [],
    receiptHistory: Array.isArray(data.receiptHistory) ? data.receiptHistory : [],
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    strategic: {
      mrr: Number(data?.strategic?.mrr || 0),
      arr: Number(data?.strategic?.arr || 0),
      growthRate: String(data?.strategic?.growthRate || "+0%"),
      projectedRevenue: Array.isArray(data?.strategic?.projectedRevenue)
        ? data.strategic.projectedRevenue
        : [],
      topUnits: Array.isArray(data?.strategic?.topUnits) ? data.strategic.topUnits : [],
      engagementScore: Number(data?.strategic?.engagementScore || 0),
      activeUsersTrend: Array.isArray(data?.strategic?.activeUsersTrend)
        ? data.strategic.activeUsersTrend
        : [],
    },
  };
};
