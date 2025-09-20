import * as Notifications from 'expo-notifications';
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


export type Reminder = {
  id: string;
  category: string;
  title: string;
  note: string;
  date?: string | Date;
  done?: boolean;
  box: number | null;
  notifyType?: 'app' | 'hardware' | 'both';
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';      
  repeatEndDate?: string | Date;                         
};

type ReminderWithAction = Reminder & { action: 'start' | 'stop' };

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
  const processedReminders = useRef<Set<string>>(new Set()); 

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
      } catch (err) {
    const error = err as Error;
        console.error('Error loading reminders:', error);
      }
    };
    loadReminders();
  }, []);

  useEffect(() => {
    const saveReminders = async () => {
      try {
        await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
      } catch (err) {
    const error = err as Error;
        console.error('Error saving reminders:', error);
      }
    };
    saveReminders();
  }, [reminders]);

  const markReminderDone = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, done: true } : reminder
      )
    );

    const doneReminder = reminders.find(r => r.id === id);
    if (doneReminder && (doneReminder.notifyType === 'hardware' || doneReminder.notifyType === 'both')) {
      sendToHardware({ ...doneReminder, action: 'stop' });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      reminders.forEach((reminder, index) => {
        if (processedReminders.current.has(reminder.id)) {
          return;
        }

        if (!reminder.date || reminder.done) {
          return;
        }

        if (!reminder.notifyType || (reminder.notifyType !== 'hardware' && reminder.notifyType !== 'both')) {
          return;
        }

        if (reminder.box === null || reminder.box === undefined) {
          return;
        }

        const reminderTime = new Date(reminder.date).getTime();
        const currentTime = now.getTime();
        const timeDiff = currentTime - reminderTime;

        if (timeDiff >= 0 && timeDiff <= 300000) {
          processedReminders.current.add(reminder.id);
          sendToHardware({ ...reminder, action: 'start' });

        }
      });
    }, 3000); 

    return () => {
      clearInterval(interval);
    };
  }, [reminders]);

  const sendToHardware = async (reminder: ReminderWithAction) => {
    try {
      const boxId = reminder.box;
      if (boxId != null) {
        console.log(`send to start esp32 box:${boxId}`)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(`http://172.20.10.2/trigger/${boxId}`, { //ip esp32
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              title: reminder.title,
              note: reminder.note,
              timestamp: new Date().toISOString()
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (response.ok) {
            const result = await response.text();
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }
    } catch (err) {
    const error = err as Error;
      let errorMessage = 'ไม่สามารถส่งคำสั่งไปยังกล่องยาได้';
      
      if (error.name === 'AbortError') {
        errorMessage += '\nสาเหตุ: หมดเวลาการเชื่อมต่อ (Timeout)';
      } else if (error.message.includes('Network')) {
        errorMessage += '\nสาเหตุ: ปัญหาเครือข่าย กรุณาตรวจสอบ WiFi';
      } else if (error.message.includes('HTTP')) {
        errorMessage += `\nสาเหตุ: ${error.message}`;
      } else {
        errorMessage += `\nสาเหตุ: ${error.message}`;
      }

    }
  };


  const addReminder = async (reminder: Reminder) => {
    const fixedReminder = {
      ...reminder,
      notifyType: reminder.notifyType || 'both' 
    };
    
    setReminders(prev => {
      const newReminders = [...prev, fixedReminder];
      return newReminders;
    });

    if (fixedReminder.date) {
      const reminderDate = new Date(fixedReminder.date);

      if (reminderDate.getTime() > Date.now()) {
        if (fixedReminder.notifyType === 'app' || fixedReminder.notifyType === 'both') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'ถึงเวลาทำแล้ว!',
              body: `${fixedReminder.title}`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: reminderDate,
            },
          });
        }
      } else {
        const timeDiff = Date.now() - reminderDate.getTime();
        if (timeDiff <= 300000 && (fixedReminder.notifyType === 'hardware' || fixedReminder.notifyType === 'both')) {
          setTimeout(() => {
          }, 1000);
        }
      }
    }
  };

  const editReminder = (updated: Reminder) => {
    const fixedUpdated = {
      ...updated,
      notifyType: updated.notifyType || 'both'
    };
    
    processedReminders.current.delete(fixedUpdated.id);
    setReminders(prev => prev.map(r => r.id === fixedUpdated.id ? fixedUpdated : r));
  };

  const deleteReminder = (id: string) => {
    processedReminders.current.delete(id);
    setReminders(prev => prev.filter(r => r.id !== id));
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