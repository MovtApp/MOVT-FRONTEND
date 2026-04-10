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
