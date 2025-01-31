import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ScrollView, PanResponder } from 'react-native';
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

const SWIPE_THRESHOLD = -80;

export default function Sidebar({ isOpen, onClose, menuItems, onSelectChat, onNewChat, onDeleteChat, onLogout }: SidebarProps) {
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

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

  useEffect(() => {
    menuItems.forEach(item => {
      if (!slideAnims[item.id]) {
        slideAnims[item.id] = new Animated.Value(0);
      }
    });
  }, [menuItems]);

  const createPanResponder = (itemId: string) => 
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        if (dx < 0) {
          slideAnims[itemId].setValue(dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(slideAnims[itemId], {
            toValue: -100,
            useNativeDriver: true,
          }).start();
          setSwipedItemId(itemId);
        } else {
          Animated.spring(slideAnims[itemId], {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setSwipedItemId(null);
        }
      },
    });

  const resetSwipe = (itemId: string) => {
    Animated.spring(slideAnims[itemId], {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSwipedItemId(null);
  };

  const handleDelete = (itemId: string) => {
    if (onDeleteChat) {
      onDeleteChat(itemId);
      resetSwipe(itemId);
    }
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    const panResponder = createPanResponder(item.id);

    return (
      <View key={index} style={styles.menuItemContainer}>
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.menuItem,
            {
              transform: [{
                translateX: slideAnims[item.id] || new Animated.Value(0)
              }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.menuItemContent}
            onPress={() => {
              onSelectChat(item.id);
              onClose();
            }}
          >
            <Text style={styles.menuText} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.dateText}>{item.createdAt}</Text>
          </TouchableOpacity>
        </Animated.View>
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
  deleteButtonContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#EF4444',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    borderRadius: 8,
  },
  deleteButton: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
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
});
