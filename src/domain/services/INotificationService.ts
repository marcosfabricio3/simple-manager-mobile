export interface INotificationService {
  /**
   * Request permissions from the user to send notifications.
   * @returns boolean indicating if permissions were granted
   */
  requestPermissionsAsync(): Promise<boolean>;

  /**
   * Schedule a local notification.
   * @param id Unique identifier for the notification (e.g. appointment ID)
   * @param title Title of the notification
   * @param body Body text of the notification
   * @param triggerDate Date object representing when the notification should fire
   */
  scheduleNotificationAsync(
    id: string,
    title: string,
    body: string,
    triggerDate: Date,
  ): Promise<void>;

  /**
   * Cancel a scheduled notification by its ID.
   * @param id The unique identifier used when scheduling the notification
   */
  cancelNotificationAsync(id: string): Promise<void>;

  /**
   * Cancel all scheduled notifications.
   */
  cancelAllNotificationsAsync(): Promise<void>;
}
