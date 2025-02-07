import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ScrollView, PanResponder, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  title: string;
  createdAt: string;
  id: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ isOpen, onClose, menuItems, onSelectChat, onNewChat, onDeleteChat, onLogout }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const itemSlideAnims = useRef(
    new Map<string, Animated.Value>()
  ).current;

  useEffect(() => {
    menuItems.forEach(item => {
      if (!itemSlideAnims.has(item.id)) {
        itemSlideAnims.set(item.id, new Animated.Value(0));
      }
    });
  }, [menuItems]);

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

  const handleDelete = (itemId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { 
          text: "Delete", 
          onPress: () => {
            if (onDeleteChat) {
              onDeleteChat(itemId);
            }
          },
          style: "destructive"
        },  
        {
          text: "Cancel",
          style: "cancel"
        }
      ],
      { cancelable: true }
    );
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    return (
      <View key={index} style={styles.menuItemContainer}>
        <TouchableOpacity 
          style={[styles.menuItem]}
          onPress={() => {
            onSelectChat(item.id);
            onClose();
          }}
        >
          <View style={styles.menuItemContent}>
            <View style={styles.menuItemRow}>
              <Text style={[styles.menuText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              {onDeleteChat && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#115E59" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.dateText}>{item.createdAt}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
          <View style={styles.menuItemContainer}>
            <TouchableOpacity 
              style={[styles.menuItem, styles.newChatButton]}
              onPress={() => {
                onNewChat();
                onClose();
              }}
            >
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuText, styles.newChatText]} numberOfLines={1}>
                  + New Chat
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item, index) => renderMenuItem(item, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No history available</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerButton} 
            onPress={onLogout || onClose}
          >
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
  menuItemContainer: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    color: '#444444',
    fontWeight: '600',
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
  newChatButton: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#99F6E4',
    borderLeftWidth: 4,
    borderLeftColor: '#2DD4BF',
  },
  newChatText: {
    color: '#115E59',
    fontWeight: '700',
  },
  menuItemContent: {
    padding: 16,
    borderRadius: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
