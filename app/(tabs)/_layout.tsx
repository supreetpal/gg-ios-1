import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  if (isAuthenticated === false) {
    return null; // Will redirect due to useEffect
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
