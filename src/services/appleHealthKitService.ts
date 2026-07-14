import AppleHealthKit, { HealthInputOptions, HealthValue } from "react-native-health";
import { Platform, NativeEventEmitter, NativeModules } from "react-native";

const PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Water,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
    ],
    write: [AppleHealthKit.Constants.Permissions.Water],
  },
};

export const ensureHealthKitPermissions = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== "ios" || !AppleHealthKit?.initHealthKit || !AppleHealthKit?.Constants) {
      return resolve(false);
    }

    AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
      if (error) {
        return resolve(false);
      }
      resolve(true);
    });
  });
};

export const fetchHealthKitSteps = (): Promise<number> => {
  return new Promise((resolve) => {
    if (Platform.OS !== "ios" || !AppleHealthKit?.getStepCount) return resolve(0);

    const options: HealthInputOptions = {
      date: new Date().toISOString(),
    };

    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        return resolve(0);
      }
      resolve(results.value || 0);
    });
  });
};

export const fetchHealthKitHeartRate = (): Promise<number> => {
  return new Promise((resolve) => {
    if (Platform.OS !== "ios" || !AppleHealthKit?.getHeartRateSamples) return resolve(0);

    const options: HealthInputOptions = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    AppleHealthKit.getHeartRateSamples(options, (err, results) => {
      if (err || !results || results.length === 0) {
        return resolve(0);
      }
      resolve(results[0].value || 0);
    });
  });
};

export const fetchHealthKitCalories = (): Promise<number> => {
  return new Promise((resolve) => {
    if (Platform.OS !== "ios" || !AppleHealthKit?.getActiveEnergyBurned) return resolve(0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const options: HealthInputOptions = {
      startDate: startOfDay.toISOString(),
    };

    AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
      if (err || !results) {
        return resolve(0);
      }
      const total = results.reduce((sum, r) => sum + r.value, 0);
      resolve(total);
    });
  });
};

/**
 * SpO2 mais recente das últimas 24h, em PERCENTUAL (ex.: 97) para bater com o
 * Android (Health Connect devolve `.percentage`). O HealthKit devolve fração
 * (0.0–1.0), então multiplicamos por 100. Cast p/ any: `getOxygenSaturationSamples`
 * pode não estar nos tipos da lib nesta versão.
 */
export const fetchHealthKitOxygen = (): Promise<number> => {
  return new Promise((resolve) => {
    const HK = AppleHealthKit as any;
    if (Platform.OS !== "ios" || !HK?.getOxygenSaturationSamples) return resolve(0);

    const options: HealthInputOptions = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    HK.getOxygenSaturationSamples(options, (err: any, results: any[]) => {
      if (err || !Array.isArray(results) || results.length === 0) return resolve(0);
      // Amostra de endDate mais recente (a ordem do retorno não é garantida).
      const latest = results.reduce((a, b) =>
        new Date(b.endDate).getTime() > new Date(a.endDate).getTime() ? b : a
      );
      const frac = typeof latest.value === "number" ? latest.value : 0;
      resolve(Math.round(frac * 100 * 100) / 100); // fração → % com 2 casas
    });
  });
};

/**
 * Horas de sono nas últimas 24h, para bater com o Android (soma das sessões).
 * O HealthKit devolve samples por estágio; somamos a duração dos estágios de
 * SONO (asleep/core/deep/rem), ignorando "INBED" (que envolve todo o período na
 * cama e sobreporia) e "AWAKE".
 */
export const fetchHealthKitSleep = (): Promise<number> => {
  return new Promise((resolve) => {
    const HK = AppleHealthKit as any;
    if (Platform.OS !== "ios" || !HK?.getSleepSamples) return resolve(0);

    const options: HealthInputOptions = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    HK.getSleepSamples(options, (err: any, results: any[]) => {
      if (err || !Array.isArray(results) || results.length === 0) return resolve(0);
      const ASLEEP = new Set(["ASLEEP", "CORE", "DEEP", "REM"]);
      let ms = 0;
      for (const s of results) {
        const v = String(s?.value || "").toUpperCase();
        if (!ASLEEP.has(v)) continue;
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        if (isFinite(start) && isFinite(end) && end > start) ms += end - start;
      }
      resolve(ms / (1000 * 60 * 60)); // ms → horas
    });
  });
};

export const subscribeHeartRate = (callback: (bpm: number) => void): (() => void) => {
  if (Platform.OS !== "ios" || !AppleHealthKit?.setObserver) return () => {};

  const type = AppleHealthKit.Constants.Observers.HeartRate;

  AppleHealthKit.setObserver({ type });

  const healthKitEmitter = new NativeEventEmitter(NativeModules.AppleHealthKit);
  const subscription = healthKitEmitter.addListener("healthKit:HeartRate:new", () => {
    fetchHealthKitHeartRate().then(callback);
  });

  return () => {
    subscription.remove();
  };
};
