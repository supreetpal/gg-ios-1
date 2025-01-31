import { generateAPIUrl } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { View, TextInput, ScrollView, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import Sidebar from '@/components/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import ChatDisplay from '@/components/ChatDisplay';

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
  },
};

export default function App() {
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

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setToken(t || '');
      if (t) fetchHistory();
    });
  }, []);

  const fetchHistory = async () => {
    if (!token) return;
    
    try {
      const response = await expoFetch(generateAPIUrl('/api/history'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      const formattedItems = data.map((item: any) => ({
        title: item.title || 'Untitled Chat',
        id: item.id,
        createdAt: new Date(item.createdAt).toLocaleDateString()
      }));
      
      setMenuItems(formattedItems);
    } catch (error) {
      console.error('Error fetching history:', error);
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
      const response = await expoFetch(generateAPIUrl('/api/chat'), {
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

  const handleSidebarOpen = () => {
    setIsSidebarOpen(true);
  };

  const loadChatMessages = async (selectedChatId: string) => {
    if (!token) return;
    
    try {
      const response = await expoFetch(generateAPIUrl(`/api/chat/${selectedChatId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setChatId(selectedChatId);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuItems}
        onSelectChat={loadChatMessages}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSidebarOpen}
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
          style={{ flex: 1, fontSize: 16 }}
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
    </SafeAreaView>
  );
}
