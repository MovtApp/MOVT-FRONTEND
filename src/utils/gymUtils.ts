interface Periods {
  abre: string;
  fecha: string;
}

interface HorariosFuncionamento {
  [key: string]: Periods[];
}

export const getGymStatus = (horarios?: HorariosFuncionamento, ativo: boolean = true) => {
  if (!horarios || Object.keys(horarios).length === 0) {
    return ativo 
      ? { isOpen: true, label: "Disponível" } 
      : { isOpen: false, label: "Inativo" };
  }

  const daysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const now = new Date();
  const dayName = daysMap[now.getDay()];
  const todayHours = horarios[dayName] as Periods[];

  if (!todayHours || todayHours.length === 0) {
    return { isOpen: false, label: "Fechado hoje" };
  }

  const currentTime = now.getHours() * 100 + now.getMinutes();

  const isOpen = todayHours.some((period) => {
    let abre = parseInt(period.abre);
    let fecha = parseInt(period.fecha);

    if (isNaN(abre) || isNaN(fecha)) return false;

    // Google returns 0000 for midnight
    if (fecha === 0) fecha = 2400;

    // Handle overnight cases
    if (fecha < abre) {
      return currentTime >= abre || currentTime <= fecha;
    }

    return currentTime >= abre && currentTime <= fecha;
  });

  return isOpen
    ? { isOpen: true, label: "Aberto agora" }
    : { isOpen: false, label: "Fechado no momento" };
};
