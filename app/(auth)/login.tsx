import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthClient } from '@/lib/api';
import { Config } from '@/constants/Config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const authClient = new AuthClient(Config.apiUrl);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const data = await authClient.login(email, password);
      if (data.success === true) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        // Store the token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>Welcome Back</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <Link href="/register" asChild>
        <TouchableOpacity style={styles.linkButton} disabled={loading}>
          <Text style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].tint }]}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 