import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthClient } from '@/lib/api';
import { Config } from '@/constants/Config';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  const authClient = new AuthClient(Config.apiUrl);

  const handleRegister = async () => {
    console.log('Starting registration process for email:', email);
    
    if (!email || !password || !confirmPassword) {
      console.log('Registration failed: Missing required fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Registration failed: Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to register user...');
      await authClient.register(email, password);
      console.log('Registration successful, attempting login...');
      
      // Check login status
      const loginData = await authClient.login(email, password);
      if (loginData.user !== null && loginData.token) {
        console.log('✅ Login successful, generating session token');
        const token = loginData.token;
        console.log('🎟️ Generated token:', `${token.substring(0, 8)}...`); // Only log first 8 chars
        
        console.log('💾 Storing user data in AsyncStorage');
        // Store the token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(loginData.user));
        
        console.log('✨ AsyncStorage updated with new session data');
        console.log('🔄 Navigation to main app');
        router.replace('/(tabs)');
      } else {
        console.log('Login failed after successful registration');
        Alert.alert('Error', 'Registration successful but login failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
      console.log('Registration failed with error:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandTitle}>
          GentleGossip
        </Text>
      </View>
      
      <TextInput
        style={[styles.input, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
        placeholderTextColor="#999"
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        placeholderTextColor="#999"
      />

      <TextInput
        style={[styles.input, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.linkButton} disabled={loading}>
          <Text style={[styles.linkText, { color: '#00A884' }]}>
            Already have an account? Login
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
    backgroundColor: '#E8F5F3',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00A884',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#7FD4C9',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#00A884',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 