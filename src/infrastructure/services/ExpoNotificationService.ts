import { INotificationService } from "@/src/domain/services/INotificationService";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export class ExpoNotificationService implements INotificationService {
  constructor() {
    this.setupNotificationHandler();
  }

  // Ensure notifications are shown even when the app is in the foreground
  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  async requestPermissionsAsync(): Promise<boolean> {
    let { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    if (finalStatus !== "granted") {
      console.error("Failed to get permission for local notification!");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return true;
  }

  async scheduleNotificationAsync(
    id: string,
    title: string,
    body: string,
    triggerDate: Date,
  ): Promise<void> {
    const hasPermission = await this.requestPermissionsAsync();
    if (!hasPermission) return;

    // Check if the date is in the past; if so, don't schedule
    if (triggerDate.getTime() < Date.now()) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { data: "goes here", id },
      },
      identifier: id,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      } as any,
    });
  }

  async cancelNotificationAsync(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  async cancelAllNotificationsAsync(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
