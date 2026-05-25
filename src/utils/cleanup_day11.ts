import AsyncStorage from "@react-native-async-storage/async-storage";

async function clearDay11() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const day11Keys = keys.filter((k) => k.includes("2026-05-11"));
    console.log("Keys found for day 11:", day11Keys);

    if (day11Keys.length > 0) {
      await AsyncStorage.multiRemove(day11Keys);
      console.log("Successfully cleared day 11 data from AsyncStorage.");
    } else {
      console.log("No data found for day 11 in AsyncStorage.");
    }
  } catch (err) {
    console.error(err);
  }
}
