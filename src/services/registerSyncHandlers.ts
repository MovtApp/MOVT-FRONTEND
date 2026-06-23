/**
 * Importa por efeito colateral os módulos que registram handlers no syncQueue.
 * Garante que o flush de boot (initSyncQueue) encontre TODOS os despachantes já
 * registrados, mesmo que as telas que normalmente importam esses serviços ainda
 * não tenham sido abertas. Importe este módulo uma vez, no boot do app.
 */
import "./caloriesService";
import "./missionService";
