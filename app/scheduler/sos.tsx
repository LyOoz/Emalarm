import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 80;
const THRESHOLD = SLIDE_WIDTH * 0.7;

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function SOSScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [slidePosition] = useState(new Animated.Value(0));

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem('sos_contacts');
      if (saved) {
        setContacts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const saveContacts = async (newContacts: EmergencyContact[]) => {
    try {
      await AsyncStorage.setItem('sos_contacts', JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  };

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
    };

    const updatedContacts = [...contacts, newContact];
    saveContacts(updatedContacts);
    setNewName('');
    setNewPhone('');
    setIsAddingContact(false);
  };

  const deleteContact = (id: string) => {
    Alert.alert(
      'ลบผู้ติดต่อ',
      'คุณต้องการลบผู้ติดต่อนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => {
            const updatedContacts = contacts.filter(c => c.id !== id);
            saveContacts(updatedContacts);
          },
        },
      ]
    );
  };

  const makeCall = (phone: string, name: string) => {
    Alert.alert(
      'โทรฉุกเฉิน',
      `โทรหา ${name} (${phone}) หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'โทร',
          onPress: async () => {
            const phoneNumber = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
            try {
              const supported = await Linking.canOpenURL(phoneNumber);
              if (supported) {
                await Linking.openURL(phoneNumber);
              } else {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโทรออกได้');
              }
            } catch (error) {
              Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการโทรออก');
            }
          },
        },
      ]
    );
  };

  const SlideToCall = ({ contact }: { contact: EmergencyContact }) => {
    const [slidePos] = useState(new Animated.Value(0));
    const [isSliding, setIsSliding] = useState(false);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsSliding(true);
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx >= 0 && gesture.dx <= SLIDE_WIDTH - 60) {
          slidePos.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx >= THRESHOLD) {
          Animated.timing(slidePos, {
            toValue: SLIDE_WIDTH - 60,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            makeCall(contact.phone, contact.name);
            setTimeout(() => {
              Animated.timing(slidePos, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
              }).start(() => setIsSliding(false));
            }, 500);
          });
        } else {
          Animated.spring(slidePos, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => setIsSliding(false));
        }
      },
    });

    return (
      <View style={styles.slideContainer}>
        <View style={styles.slideTrack}>
          <Text style={styles.slideText}>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            {' '}เลื่อนเพื่อโทรฉุกเฉิน{' '}
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </Text>
        </View>
        <Animated.View
          style={[
            styles.slideButton,
            {
              transform: [{ translateX: slidePos }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="call" size={28} color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>โทรฉุกเฉิน (SOS)</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Emergency Number 1669 */}
      <View style={styles.emergencySection}>
        <View style={styles.emergencyCard}>
          <Ionicons name="medical" size={48} color="#ff0000ff" />
          <Text style={styles.emergencyTitle}>โทรฉุกเฉิน 1669</Text>
          <Text style={styles.emergencySubtitle}>บริการการแพทย์ฉุกเฉิน</Text>
          <TouchableOpacity
            style={styles.emergencyCallButton}
            onPress={() => makeCall('1669', 'โทรฉุกเฉิน')}
          >
            <Ionicons name="call" size={24} color="#FFFFFF" />
            <Text style={styles.emergencyCallText}>โทร 1669</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contactsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>รายชื่อติดต่อฉุกเฉิน</Text>
          <TouchableOpacity
            onPress={() => setIsAddingContact(!isAddingContact)}
            style={styles.addButton}
          >
            <Ionicons
              name={isAddingContact ? 'close' : 'add-circle'}
              size={28}
              color="#4ECDC4"
            />
          </TouchableOpacity>
        </View>

        {isAddingContact && (
          <View style={styles.addContactForm}>
            <TextInput
              style={styles.input}
              placeholder="ชื่อ"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#A0AEC0"
            />
            <TextInput
              style={styles.input}
              placeholder="เบอร์โทรศัพท์"
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity style={styles.saveButton} onPress={addContact}>
              <Text style={styles.saveButtonText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        )}

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>ยังไม่มีรายชื่อติดต่อฉุกเฉิน</Text>
            <Text style={styles.emptySubtext}>กดปุ่ม + เพื่อเพิ่มผู้ติดต่อ</Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <View style={styles.contactAvatar}>
                    <Ionicons name="person" size={24} color="#4ECDC4" />
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteContact(contact.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#74ccb5" />
                  </TouchableOpacity>
                </View>
                <SlideToCall contact={contact} />
              </View>
            ))}
          </View>
        )}
        
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#74ccb5',
    paddingTop: Platform.OS === 'ios' ? 40 : 40,
    paddingBottom: 9,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    
  },
  backButton: {
    width: 40,
    height: 40,
    
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: -30,
  },
  emergencySection: {
    padding: 40,
  },
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#74ccb5',
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 15,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 5,
    marginBottom: 20,
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#74ccb5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#74ccb5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyCallText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  contactsSection: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  addButton: {
    padding: 5,
  },
  addContactForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#74ccb5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
  },
  contactsList: {
    gap: 15,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#718096',
  },
  deleteButton: {
    padding: 8,
  },
  slideContainer: {
    height: 60,
    backgroundColor: '#E6FFFA',
    borderRadius: 30,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideTrack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#74ccb5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideButton: {
    position: 'absolute',
    left: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#74ccb5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#74ccb5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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

});