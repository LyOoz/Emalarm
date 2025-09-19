
import React, { useEffect } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();


  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/scheduler/setting');
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconBox}>
          <Image source={require('./asset/img/logo.png')} style={styles.icon} />
        </View>
      </View>

      <ActivityIndicator size="large" color="#008080" />
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
  iconText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
  },
});
