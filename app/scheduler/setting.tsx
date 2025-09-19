import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReminder } from './ReminderContext';

export default function ReminderSettings() {
  const router = useRouter();
  const { getTodayReminders, markReminderDone } = useReminder();
  const [refreshing, setRefreshing] = useState(false);


  const handleDone = (id: string) => {
    markReminderDone(id);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  interface Reminder {
    id: string;
    title: string;
    note?: string;
    date: string | Date;
    done: boolean;
    box?: number | null    
  }
  const getTimeRemaining = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return { text: 'ถึงเวลาทำแล้ว!', urgent: true };

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 1) return { text: `เหลืออีก ${diffDays} วัน`, urgent: false };
    if (diffHours >= 1) return { text: `เหลืออีก ${diffHours} ชม. ${String(diffMins % 60).padStart(2, '0')} น.`, urgent: false };
    if (diffMins >= 1) return { text: `เหลืออีก ${diffMins} นาที`, urgent: true };
    return { text: `เหลืออีก ${diffSecs} วินาที`, urgent: true };
  };



  const renderItem = ({ item }: { item: Reminder }) => {
    const isDone = item.done;
    const now = new Date();
    const reminderDate = new Date(item.date); 
    const isTimeUp = reminderDate.getTime() <= now.getTime();
    const timeInfo = getTimeRemaining(reminderDate);

    return (
      <View style={[styles.reminderItem, isDone && styles.doneItem]}>
        <View style={styles.itemHeader}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isDone ? "checkmark-circle" : "medical-outline"} 
              size={24} 
              color={isDone ? "#4CAF50" : "#FF6B6B"} 
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.reminderText, isDone && styles.doneText]}>
              {item.title}
            </Text>
            {item.note && (
              <Text style={[styles.noteText, isDone && styles.doneNoteText]}>
                {item.note}
              </Text>
            )}
            {item.box != null && (
                <Text style={{ fontSize: 12, color: '#888' }}>กล่องยา: {item.box}</Text>
            )}

            {timeInfo && (
              <View style={[styles.timeContainer, timeInfo.urgent && styles.urgentTimeContainer]}>
                <Text style={[styles.timeText, { color: timeInfo.urgent ? '#FF6B6B' : '#4ECDC4' }]}>
                  {timeInfo.text}
                </Text>
              </View>
            )}
          </View>
        </View>
        {!isDone && isTimeUp && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => handleDone(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>เสร็จแล้ว</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredReminders = (getTodayReminders() as Reminder[])
    .filter(item => !item.done)
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.headerFixed}>
        <Text style={styles.headerTitle}>รายการแจ้งเตือน</Text>
        <Text style={styles.headerSubtitle}>
          {filteredReminders.length} รายการที่ต้องทำวันนี้
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#008080']}
            tintColor="#008080"
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.medicationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={32} color="#FF6B6B" />
              <Text style={styles.medicationTitle}>รายการแจ้งเตือนวันนี้</Text>
            </View>
            {filteredReminders.length > 0 ? (
              <FlatList
                data={filteredReminders}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.emptyText}>ทำครบทุกรายการแล้ว</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.allRemindersCard}
            onPress={() => router.push('/scheduler/all-reminders')}
            activeOpacity={0.8}
            
          >
            <View style={styles.cardContent}>
              <Ionicons name="list-outline" size={28} color="#4ECDC4" />
              <Text style={styles.allRemindersTitle}>
                รายการแจ้งเตือนทั้งหมด
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#4ECDC4" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/scheduler/setting')}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={24} color="#FFFFFF" />
          <Text style={styles.footerText}>หน้าหลัก</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.footerButton, styles.addButton]}
          onPress={() => router.push('/scheduler/create-event')}
          activeOpacity={0.7}
        >
          <View style={styles.footerButton}>
            <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
            <Text style={styles.footerText}>เพิ่มการแจ้งเตือน</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/scheduler/all-reminders')}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={24} color="#FFFFFF" />
          <Text style={styles.footerText}>รายการแจ้งเตือน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 9,
    paddingVertical: 20,
    backgroundColor: '#008080',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  medicationCard: {
    backgroundColor: '#FFE5E5',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  medicationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 12,
    flex: 1,
  },
  reminderItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  doneItem: {
    backgroundColor: '#E8F5E8',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    lineHeight: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    lineHeight: 20,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#A0AEC0',
  },
  doneNoteText: {
    color: '#CBD5E0',
  },
  timeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#45B7D1',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  urgentTimeContainer: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  allRemindersCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  allRemindersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#008080',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    position: 'relative',
  },
});