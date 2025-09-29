import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  ScrollView,
  Platform,
  Image
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
    box?: number | null;
    category?: string;
  }

  const getCategoryIcon = (category?: string): { image: any; bg: string } => {
    switch (category) {
      case 'ยา':
        return { image: require('../asset/img/medic.png'), bg: '#DBEAFE' };
      case 'นัดหมอ':
        return { image: require('../asset/img/doctor.png'), bg: '#EDE9FE' };
      case 'นัดหมายทั่วไป':
        return { image: require('../asset/img/hangout.png'), bg: '#D1FAE5' };
      case 'การศึกษา':
        return { image: require('../asset/img/study.png'), bg: '#FEF3C7' };
      default:
        return { image: require('../asset/img/medic.png'), bg: '#DBEAFE' };
    }
  };

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
    const iconData = getCategoryIcon(item.category);

    const dateObj = new Date(item.date);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return (
      <View style={[styles.cardItem, isDone && styles.cardItemDone]}>
        <View style={[styles.categoryIconContainer, { backgroundColor: iconData.bg }]}>
          <Image 
            source={iconData.image} 
            style={styles.categoryImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, isDone && styles.doneText]}>
            {item.title}
          </Text>
          
          <Text style={[styles.cardTime, isDone && styles.doneText]}>
            {hours}:{minutes}
          </Text>

          {item.note && (
            <Text style={[styles.cardNote, isDone && styles.doneNoteText]}>
              {item.note}
            </Text>
          )}

          {item.box != null && (
            <Text style={styles.cardBox}>กล่องยา: {item.box}</Text>
          )}

          {timeInfo && !isDone && (
            <View style={[styles.timeTag, timeInfo.urgent && styles.urgentTimeTag]}>
              <Text style={[styles.timeTagText, { color: timeInfo.urgent ? '#FF6B6B' : '#4ECDC4' }]}>
                {timeInfo.text}
              </Text>
            </View>
          )}

          {!isDone && isTimeUp && (
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => handleDone(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>เสร็จแล้ว</Text>
            </TouchableOpacity>
          )}
        </View>
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
            colors={['#74ccb5']}
            tintColor="#74ccb5"
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
                scrollEnabled={false}
                contentContainerStyle={styles.cardList}
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
            <View style={styles.cardContentRow}>
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
          onPress={() => router.push('/scheduler/sos')}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
          <Text style={styles.footerText}>โทรฉุกเฉิน</Text>
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
    backgroundColor: '#74ccb5',
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
    backgroundColor: '#FFFFFF',
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
    color: '#2D3748',
    marginLeft: 12,
    flex: 1,
  },
  cardList: {
    gap: 16,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardItemDone: {
    backgroundColor: '#F0F4F8',
    opacity: 0.7,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 50,
    height: 50,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
  },
  cardNote: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 6,
  },
  cardBox: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#A0AEC0',
  },
  doneNoteText: {
    color: '#CBD5E0',
  },
  timeTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F4FD',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  urgentTimeTag: {
    backgroundColor: '#FFE5E5',
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
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
  cardContentRow: {
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
    backgroundColor: '#74ccb5',
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