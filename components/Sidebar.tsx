import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useEffect, useRef } from 'react';

interface MenuItem {
  title: string;
  createdAt: string;
  id: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export default function Sidebar({ isOpen, onClose, menuItems }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.backdrop, { opacity: fadeAnim }]} 
        onTouchStart={onClose}
      />
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>History</Text>
        </View>
        <ScrollView style={styles.content}>
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => {
                  // Handle menu item press
                  onClose();
                }}
              >
                <View>
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Text style={styles.dateText}>{item.createdAt}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No history available</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={onClose}>
            <Text style={styles.footerText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#134E4A',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#F0FDFA',
    paddingTop: 50,
    shadowColor: '#134E4A',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    flexDirection: 'column',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#99F6E4',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#134E4A',
    letterSpacing: -0.5,
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#99F6E4',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuText: {
    fontSize: 17,
    color: '#444444',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#115E59',
    marginTop: 4,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: '#CCFBF1',
    paddingVertical: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  footerButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2DD4BF',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#134E4A',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0FDFA',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#115E59',
    textAlign: 'center',
  },
});
