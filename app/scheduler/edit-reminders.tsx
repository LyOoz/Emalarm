import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReminder } from './ReminderContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditReminder() {
  const router = useRouter();
  const { selectedReminder, editReminder, setSelectedReminder, reminders } = useReminder();

  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const categories = [
    'งาน', 'ส่วนตัว', 'สุขภาพ', 'การเงิน', 'การศึกษา', 
    'ครอบครัว', 'เพื่อน', 'ออกกำลังกาย', 'อื่นๆ'
  ];

  useEffect(() => {
    
    if (selectedReminder) {
      setTitle(selectedReminder.title);
      setNote(selectedReminder.note || '');
      setCategory(selectedReminder.category);
      if (selectedReminder.date) {
        setSelectedDate(new Date(selectedReminder.date));
      }
      if (selectedReminder.box !== undefined) {
        setSelectedBox(selectedReminder.box);
      }
    } else {
      router.back();
    }
  }, [selectedReminder]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกหัวข้อการแจ้งเตือน');
      return;
    }

    if (!category) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!selectedReminder) return;

      if (selectedBox !== null) {
        const isBoxUsed = reminders.some(
          r => r.box === selectedBox && r.id !== selectedReminder.id && !r.done
        );
        if (isBoxUsed) {
          Alert.alert('กล่องถูกใช้งานแล้ว', `กล่อง ${selectedBox} ถูกใช้ไปแล้ว เลือกกล่องอื่น`);
          return;
        }
      }

    const updatedReminder = {
      ...selectedReminder,
      title: title.trim(),
      note: note.trim(),
      category,
      date: selectedDate,
      box: selectedBox, // อัปเดตกล่องยา
    };

    editReminder(updatedReminder);
    setSelectedReminder(null);

    Alert.alert('บันทึกสำเร็จ', 'แก้ไขการแจ้งเตือนเรียบร้อยแล้ว', [
      {
        text: 'ตกลง',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert(
      'ยกเลิกการแก้ไข',
      'คุณต้องการยกเลิกการแก้ไขใช่หรือไม่?',
      [
        { text: 'ไม่', style: 'cancel' },
        {
          text: 'ใช่',
          style: 'destructive',
          onPress: () => {
            setSelectedReminder(null);
            router.back();
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear());
      newDate.setMonth(date.getMonth());
      newDate.setDate(date.getDate());
      setSelectedDate(newDate);
    }
  };

  const onTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedReminder) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขการแจ้งเตือน</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>แจ้งเตือน</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="กรอกหัวข้อการแจ้งเตือน"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>หมายเหตุ</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={note}
            onChangeText={setNote}
            placeholder="เพิ่มหมายเหตุ (ไม่จำเป็น)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
        <Text style={styles.label}>เลือกกล่อง</Text>
        <View style={styles.categoryContainer}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.categoryButton,
                selectedBox === num && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedBox(num)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedBox === num && styles.selectedCategoryText,
                ]}
              >
                กล่อง {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>หมวดหมู่</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.selectedCategoryButton,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.selectedCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>วันที่และเวลา</Text>
          
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#008080" />
            <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#008080" />
            <Text style={styles.dateTimeText}>{formatTime(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>ตัวอย่าง</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewCategory}>
              <Text style={styles.previewCategoryText}>{category || 'หมวดหมู่'}</Text>
            </View>
            <Text style={styles.previewReminderTitle}>
              {title || 'หัวข้อการแจ้งเตือน'}
            </Text>
            {note ? (
              <Text style={styles.previewNote}>{note}</Text>
            ) : null}
            <Text style={styles.previewDate}>
              {formatDate(selectedDate)} เวลา {formatTime(selectedDate)}
            </Text>
          </View>
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
          onPress={() => {
            setSelectedReminder(null);
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
          onPress={() => router.push('/scheduler/all-reminders')}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={24} color="#FFFFFF" />
          <Text style={styles.footerText}>รายการแจ้งเตือน</Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalButton}>ยกเลิก</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>เลือกวันที่</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalButton}>เสร็จ</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
                themeVariant="light"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalButton}>ยกเลิก</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>เลือกเวลา</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalButton}>เสร็จ</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                themeVariant="light"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#008080',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategoryButton: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#008080',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  previewCategoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  previewReminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  previewNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  previewDate: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalButton: {
    fontSize: 16,
    color: '#008080',
    fontWeight: '500',
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 10,
  },
  footer: {
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
