import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartApp = () => {
    router.push('/scheduler/setting');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconBox}>
          <Image source={require('./asset/img/logo.png')} style={styles.icon} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#74ccb5" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleStartApp}>
          <Text style={styles.buttonText}>เริ่มต้นการใช้งาน</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  icon: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: '#74ccb5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
