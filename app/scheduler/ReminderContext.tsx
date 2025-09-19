import * as Notifications from 'expo-notifications';
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';


export type Reminder = {
  id: string;
  category: string;
  title: string;
  note: string;
  date?: string | Date;
  done?: boolean;
  box: number | null;
  notifyType?: 'app' | 'hardware' | 'both';
};

type ReminderContextType = {
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  editReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  markReminderDone: (id: string) => void;
  selectedReminder: Reminder | null;
  setSelectedReminder: (reminder: Reminder | null) => void;
  getTodayReminders: () => Reminder[];
};

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const stored = await AsyncStorage.getItem('reminders');
        if (stored) {
          const parsed: Reminder[] = JSON.parse(stored);
          const restored = parsed.map((r: Reminder) => ({
            ...r,
            date: r.date ? new Date(r.date) : undefined,
          }));
          setReminders(restored);
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };
    loadReminders();
  }, []);

  useEffect(() => {
    const saveReminders = async () => {
      try {
        await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
      } catch (error) {
        console.error('Error saving reminders:', error);
      }
    };
    saveReminders();
  }, [reminders]);

  const sendToHardware = async (reminder: Reminder) => {
    try {
      const boxId = reminder.box;
      if (boxId != null) {
        const response = await fetch(`http://172.20.10.2/trigger/${boxId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: reminder.title }),
        });

        const result = await response.json();
        console.log('Hardware response:', result);
        Alert.alert('ส่งคำสั่งไปยังกล่องยาแล้ว', `กล่องที่ ${boxId}`);
      }
    } catch (error) {
      console.error('send to hardware error:', error);
    }
  };

  const addReminder = async (reminder: Reminder) => {
    setReminders(prev => [...prev, reminder]);

  if (reminder.date) {
    const reminderDate = new Date(reminder.date);
    console.log('Reminder date:', reminderDate);
    console.log('Current time:', new Date());

    if (reminderDate.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ถึงเวลาทำแล้ว!',
          body: `${reminder.title}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderDate,
        },
      });
    } else {
      console.warn('Reminder time is in the past, notification not scheduled.');
    }
  }

    
    if (reminder.notifyType === 'hardware' || reminder.notifyType === 'both') {
      if (reminder.box != null) {
        await sendToHardware(reminder);
      }
    }

  };

  const editReminder = (updated: Reminder) => {
    setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const markReminderDone = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, done: true } : reminder
      )
    );
  };

  const getTodayReminders = () => {
    const now = new Date();
    return reminders.filter(r => {
      if (!r.date) return false;
      const reminderDate = new Date(r.date);
      return (
        reminderDate.getDate() === now.getDate() &&
        reminderDate.getMonth() === now.getMonth() &&
        reminderDate.getFullYear() === now.getFullYear()
      );
    });
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        editReminder,
        deleteReminder,
        markReminderDone,
        selectedReminder,
        setSelectedReminder,
        getTodayReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminder = (): ReminderContextType => {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('4044');
  return context;
};
