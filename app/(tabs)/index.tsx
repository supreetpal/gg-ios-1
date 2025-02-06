import { generateAPIUrl } from '@/lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { View, TextInput, ScrollView, Text, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import Sidebar from '@/components/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import ChatDisplay from '@/components/ChatDisplay';
import { useRouter } from 'expo-router';

interface MenuItem {
  title: string;
  id: string;
  createdAt: string;
}

const styles = {
  header: {
    backgroundColor: '#00A884',
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    height: 70,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500' as const,
  },
  headerButton: {
    backgroundColor: '#7FD4C9',
    padding: 6,
    borderRadius: 8,
    width: 65,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerButtonText: {
    color: '#333',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#E8F5F3',
  },
  inputContainer: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 56,
  },
};

export default function App() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(`${
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => 
      (c === 'x' ? (Math.random() * 16 | 0) : ((Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16)
  )}`);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchHistory = async () => {
    //console.log('fetchHistory started');
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token retrieved:', token);
        
      if (!token) {
        console.log('No token found, returning early');
        return;
      }

      //console.log('Making API request to fetch history');
      const response = await expoFetch(generateAPIUrl('api/history'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      //console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        //console.log('History data received:', data.length, 'items');
        const formattedItems = data.map((item: any) => ({
          title: item.title || 'Untitled Chat',
          id: item.id,
          createdAt: new Date(item.createdAt).toLocaleDateString()
        }));
        
        setMenuItems(formattedItems);
      } else {
        console.error('Failed to fetch history:', response.status);
      }
    } catch (error) {
      console.error('Error in fetchHistory:', error);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user' as const, content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      const response = await expoFetch(generateAPIUrl('api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          modelId: 'coach',
          id: chatId
        }),
      });

      const text = await response.text();
      let assistantContent = '';
      
      const assistantMessage: Message = { 
        role: 'assistant' as const, 
        content: '', 
        id: Date.now().toString() 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      scrollViewRef.current?.scrollToEnd({ animated: true });
      
      const chunks = text.split('\n');
      for (const chunk of chunks) {
        if (!chunk) continue;
        
        const indicator = chunk[0];
        const content = chunk.slice(2);
        
        switch (indicator) {
          case '0':
            assistantContent += content.replace(/^"|"$/g, '');
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: assistantContent
                };
              }
              return newMessages;
            });
            scrollViewRef.current?.scrollToEnd({ animated: true });
            break;
        }
      }
      
      await fetchHistory();
      
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSidebar = () => {
    //console.log('Sidebar toggling, current state:', isSidebarOpen);
    if (!isSidebarOpen) {
      Keyboard.dismiss();
      //console.log('Attempting to fetch history');
      fetchHistory().catch(err => {
        console.error('Error fetching history:', err);
      });
    }
    setIsSidebarOpen(!isSidebarOpen);
  };

  const loadChatMessages = async (selectedChatId: string) => {
    console.log('Index: loadChatMessages called with id:', selectedChatId);
    const currentToken = await AsyncStorage.getItem('token');
    if (!currentToken) {
      console.log('Index: No token found in loadChatMessages');
      return;
    }
    
    try {
      const url = generateAPIUrl(`api/chat/${selectedChatId}`);
      console.log('Index: Fetching messages from:', url);
      const response = await expoFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      console.log('Index: Chat messages response status:', response.status);

      if (!response.ok) {
        console.log('Index: Failed to fetch chat messages:', response.status);
        throw new Error('Failed to fetch chat messages');
      }

      const data = await response.json();
      console.log('Index: Received messages data:', data);
      setMessages(data.messages || []);
      setChatId(selectedChatId);
      console.log('Index: Updated messages and chatId');
    } catch (error) {
      console.error('Index: Error loading chat messages:', error);
    }
  };

  const handleNewChat = () => {
    // Generate a new UUID for the chat
    const newChatId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => 
      (c === 'x' ? (Math.random() * 16 | 0) : ((Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16)
    );
    
    // Clear messages and set new chat ID
    setMessages([]);
    setChatId(newChatId);
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    console.log('Index: handleDeleteChat called with id:', chatIdToDelete);
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('Index: No token found, returning early');
      return;
    }
    
    try {
      console.log('Index: Making DELETE request to:', `api/chat/${chatIdToDelete}`);
      const response = await expoFetch(generateAPIUrl(`api/chat/${chatIdToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Index: Delete response status:', response.status);

      if (!response.ok) {
        console.error('Index: Failed to delete chat:', response.status);
        throw new Error('Failed to delete chat');
      }

      console.log('Index: Successfully deleted chat, refreshing history');
      await fetchHistory();
      
      if (chatIdToDelete === chatId) {
        console.log('Index: Deleted current chat, starting new chat');
        handleNewChat();
      }
    } catch (error) {
      console.error('Index: Error in handleDeleteChat:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear the token from storage
      await AsyncStorage.removeItem('token');
      // Clear the app state
      setToken('');
      setMessages([]);
      setMenuItems([]);
      // Close the sidebar
      setIsSidebarOpen(false);
      // Navigate to login page
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuItems}
        onSelectChat={loadChatMessages}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleSidebar}
          >
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GentleGossip</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Talk</Text>
          </TouchableOpacity>
        </View>

        <ChatDisplay messages={messages} isTyping={isTyping} />

        <View style={styles.inputContainer}>
          <TextInput
            style={{ 
              flex: 1, 
              fontSize: 16,
              paddingVertical: 8,
              maxHeight: 100,
            }}
            placeholder="Send a message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            autoFocus={true}
            multiline={true}
            numberOfLines={1}
            textAlignVertical="center"
          />
          <TouchableOpacity 
            onPress={handleSubmit}
            style={{
              padding: 8,
              marginLeft: 8,
              backgroundColor: '#00A884',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
