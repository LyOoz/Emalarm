import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, RefreshControl, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReminder, Reminder } from './ReminderContext';

export default function AllReminders() {
  const router = useRouter();
  const { reminders, setSelectedReminder, deleteReminder } = useReminder();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000); 
  };

  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    router.push('/scheduler/edit-reminders'); 
  };

  const handleDelete = (reminderId: string) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => {
            deleteReminder(reminderId);
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.headerFixed}>
        <Text style={styles.headerTitle}>รายการแจ้งเตือนทั้งหมด</Text>
        <Text style={styles.subtitle}>ทั้งหมด {reminders.length} รายการ</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ 
          paddingTop: Platform.OS === 'ios' ? 120 : 100, 
          paddingBottom: 120, 
          paddingHorizontal: 16 
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#74ccb5']}
            tintColor="#74ccb5"
          />
        }
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>ยังไม่มีรายการแจ้งเตือน</Text>
            <Text style={styles.emptySubtext}>เพิ่มรายการแจ้งเตือนใหม่ได้ที่ปุ่มด้านล่าง</Text>
          </View>
        ) : (
          reminders.map((item) => (
            <View key={item.id} style={[
              styles.reminderItem,
              item.done && styles.doneItem
            ]}>
              <View style={styles.reminderContent}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {item.box != null && (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryText}>กล่อง {item.box}</Text>
                </View>
              )}
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
                </View>
                
                <Text style={[
                  styles.reminderText,
                  item.done && styles.doneText
                ]}>{item.title}</Text>
                
                {item.note ? (
                  <Text style={styles.noteText}>{item.note}</Text>
                ) : null}
                
                {item.date && (
                  <Text style={styles.dateText}>
                    {new Date(item.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                
                <TouchableOpacity 
                  onPress={() => handleEdit(item)} 
                  style={styles.iconButton}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id)} 
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
          onPress={() => {
            setSelectedReminder(null); // ล้างการเลือก reminder เพื่อสร้างใหม่
            router.push('/scheduler/create-event');
          }}
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
  },
  scrollView: {
    flex: 1,
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
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  doneItem: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  reminderContent: {
    flex: 1,
    paddingRight: 12,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#74ccb5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  reminderText: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  noteText: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  dateText: { 
    fontSize: 13, 
    color: '#007AFF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
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