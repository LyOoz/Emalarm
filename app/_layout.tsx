import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ReminderProvider } from './scheduler/ReminderContext'; 

export default function Layout() {
    useEffect(() => {
      Notifications.requestPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          alert('Permission for notifications not granted!');
        }
      });
    }, []);

  return (
    <ReminderProvider>
      <Stack />
    </ReminderProvider>
  );
}
