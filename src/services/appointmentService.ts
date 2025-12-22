import { API_BASE_URL } from "../config/api";

/**
 * Buscar disponibilidade de um trainer
 * @param trainerId - ID do trainer
 * @param date - Data opcional (YYYY-MM-DD)
 * @param sessionToken - Token de autenticação
 */
export const getAvailability = async (trainerId: string, date?: string, sessionToken?: string) => {
  try {
    console.log("[getAvailability] Buscando disponibilidade do trainer:", trainerId);

    let url = `${API_BASE_URL}/appointments/availability/${trainerId}`;
    if (date) {
      url += `?date=${date}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Erro ao buscar disponibilidade: ${response.status}`);
    }

    const data = await response.json();
    console.log("[getAvailability] Disponibilidade obtida:", data);
    return data;
  } catch (error) {
    console.error("[getAvailability] Erro:", error);
    throw error;
  }
};

/**
 * Criar um novo agendamento
 * @param trainerId - ID do trainer
 * @param date - Data do agendamento (YYYY-MM-DD)
 * @param startTime - Hora de início (HH:MM)
 * @param endTime - Hora de fim (HH:MM)
 * @param notes - Notas adicionais (opcional)
 * @param sessionToken - Token de autenticação
 */
export const createAppointment = async (
  trainerId: string,
  date: string,
  startTime: string,
  endTime: string,
  notes: string = "",
  sessionToken: string
) => {
  try {
    console.log("[createAppointment] Criando agendamento:", {
      trainerId,
      date,
      startTime,
      endTime,
      notes,
    });

    if (!sessionToken) {
      throw new Error("Token de autenticação é obrigatório");
    }

    // Verificar se todos os campos obrigatórios estão presentes
    if (!trainerId || !date || !startTime || !endTime) {
      throw new Error(
        "Todos os campos obrigatórios devem ser fornecidos para criar um agendamento"
      );
    }

    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        trainerId,
        date,
        startTime,
        endTime,
        notes: notes || null,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log("[createAppointment] Erro detalhado do servidor:", errorData);
      } catch (parseError) {
        // Se não for possível parsear o JSON, usar o status como fallback
        errorData = {
          error: `Erro ao criar agendamento: ${response.status} - ${response.statusText}`,
        };
        console.log(
          "[createAppointment] Erro de resposta do servidor (não JSON):",
          response.status,
          response.statusText
        );
      }
      throw new Error(errorData.error || `Erro ao criar agendamento: ${response.status}`);
    }

    const data = await response.json();
    console.log("[createAppointment] Agendamento criado com sucesso:", data);
    return data;
  } catch (error) {
    console.error("[createAppointment] Erro:", error);
    throw error;
  }
};

/**
 * Listar agendamentos do usuário
 * @param role - 'client' ou 'trainer'
 * @param sessionToken - Token de autenticação
 */
export const listAppointments = async (role: "client" | "trainer", sessionToken: string) => {
  try {
    console.log("[listAppointments] Listando agendamentos como:", role);

    if (!sessionToken) {
      throw new Error("Token de autenticação é obrigatório");
    }

    const response = await fetch(`${API_BASE_URL}/appointments?role=${role}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar agendamentos: ${response.status}`);
    }

    const data = await response.json();
    console.log("[listAppointments] Agendamentos obtidos:", data);
    return data;
  } catch (error) {
    console.error("[listAppointments] Erro:", error);
    throw error;
  }
};

/**
 * Buscar agendamentos de um trainer em uma data específica
 * @param trainerId - ID do trainer
 * @param date - Data do agendamento (YYYY-MM-DD, opcional)
 * @param sessionToken - Token de autenticação (opcional)
 */
export const getTrainerAppointments = async (
  trainerId: string,
  date?: string,
  sessionToken?: string
) => {
  try {
    console.log("[getTrainerAppointments] Buscando agendamentos do trainer:", trainerId);

    let url = `${API_BASE_URL}/appointments/trainer/${trainerId}`;
    if (date) {
      url += `?date=${date}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Erro ao buscar agendamentos: ${response.status}`);
    }

    const data = await response.json();
    console.log("[getTrainerAppointments] Agendamentos obtidos:", data);
    return data;
  } catch (error) {
    console.error("[getTrainerAppointments] Erro:", error);
    throw error;
  }
};

/**
 * Atualizar agendamento
 * @param appointmentId - ID do agendamento
 * @param status - Novo status ('pendente', 'confirmado', 'cancelado', 'concluido')
 * @param notas - Notas atualizadas (opcional)
 * @param sessionToken - Token de autenticação
 */
export const updateAppointment = async (
  appointmentId: string,
  status?: string,
  notas?: string,
  sessionToken?: string
) => {
  try {
    console.log("[updateAppointment] Atualizando agendamento:", appointmentId);

    if (!sessionToken) {
      throw new Error("Token de autenticação é obrigatório");
    }

    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        status: status || undefined,
        notas: notas || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ao atualizar agendamento: ${response.status}`);
    }

    const data = await response.json();
    console.log("[updateAppointment] Agendamento atualizado:", data);
    return data;
  } catch (error) {
    console.error("[updateAppointment] Erro:", error);
    throw error;
  }
};

/**
 * Cancelar agendamento
 * @param appointmentId - ID do agendamento
 * @param sessionToken - Token de autenticação
 */
export const cancelAppointment = async (appointmentId: string, sessionToken: string) => {
  try {
    console.log("[cancelAppointment] Cancelando agendamento:", appointmentId);

    if (!sessionToken) {
      throw new Error("Token de autenticação é obrigatório");
    }

    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ao cancelar agendamento: ${response.status}`);
    }

    const data = await response.json();
    console.log("[cancelAppointment] Agendamento cancelado:", data);
    return data;
  } catch (error) {
    console.error("[cancelAppointment] Erro:", error);
    throw error;
  }
};
