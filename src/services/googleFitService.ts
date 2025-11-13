import GoogleFit, { BucketUnit, Scopes, StepsResponse } from "react-native-google-fit";

const AUTH_OPTIONS = {
  scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_LOCATION_READ],
};

const getTodayRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const processStepPayload = (payload: unknown, listener: (steps: number) => void) => {
  let numericValue: number | undefined;

  if (typeof payload === "number") {
    numericValue = payload;
  } else if (typeof payload === "string") {
    const parsed = Number(payload);
    numericValue = Number.isNaN(parsed) ? undefined : parsed;
  } else if (payload && typeof payload === "object") {
    const payloadObj = payload as Record<string, unknown>;

    if (typeof payloadObj.steps === "number") {
      numericValue = payloadObj.steps;
    } else if (typeof payloadObj.value === "number") {
      numericValue = payloadObj.value;
    } else if (Array.isArray(payloadObj.steps) && payloadObj.steps.length > 0) {
      const last = payloadObj.steps[payloadObj.steps.length - 1] as unknown;
      if (typeof last === "number") {
        numericValue = last;
      } else if (last && typeof (last as Record<string, unknown>).value !== "undefined") {
        const parsed = Number((last as Record<string, unknown>).value);
        numericValue = Number.isNaN(parsed) ? undefined : parsed;
      }
    }
  }

  if (typeof numericValue === "number" && !Number.isNaN(numericValue)) {
    listener(numericValue);
  }
};

export const ensureGoogleFitPermissions = async (): Promise<boolean> => {
  try {
    await GoogleFit.checkIsAuthorized();
    if (GoogleFit.isAuthorized) {
      return true;
    }

    const authResult = await GoogleFit.authorize(AUTH_OPTIONS);
    return Boolean(authResult.success);
  } catch (error) {
    console.warn("Falha ao solicitar permissões do Google Fit", error);
    return false;
  }
};

export const fetchTodayStepCount = async (): Promise<number> => {
  try {
    const { startDate, endDate } = getTodayRange();
    const results = await GoogleFit.getDailyStepCountSamples({
      startDate,
      endDate,
      bucketInterval: 1,
      bucketUnit: BucketUnit.DAY,
    });

    if (!Array.isArray(results)) {
      return 0;
    }

    const preferredSources = new Set([
      "com.google.android.gms:estimated_steps",
      "com.google.android.gms",
    ]);

    const today = results.find((sample: StepsResponse) => preferredSources.has(sample.source)) ?? results[0];

    if (!today || !Array.isArray(today.steps) || today.steps.length === 0) {
      return 0;
    }

    const latestEntry = today.steps[today.steps.length - 1];
    return Number(latestEntry.value) || 0;
  } catch (error) {
    console.warn("Falha ao buscar passos no Google Fit", error);
    return 0;
  }
};

export const subscribeToStepUpdates = (
  listener: (steps: number) => void
): (() => void) => {
  try {
    GoogleFit.startRecording(() => {
      // Apenas garante que o Google Fit está gravando dados de atividade
    }, ["step"]);

    const subscription = GoogleFit.observeSteps((maybeError: unknown, payload?: unknown) => {
      if (typeof maybeError === "boolean") {
        if (maybeError) {
          console.warn("Erro ao observar passos no Google Fit", payload);
          return;
        }
        processStepPayload(payload, listener);
        return;
      }

      processStepPayload(maybeError, listener);
    }) as unknown as { remove?: () => void };

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else {
        GoogleFit.removeListeners();
      }
    };
  } catch (error) {
    console.warn("Falha ao assinar passos do Google Fit", error);
    return () => undefined;
  }
};
