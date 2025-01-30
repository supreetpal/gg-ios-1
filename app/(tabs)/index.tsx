import { generateAPIUrl } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { View, TextInput, ScrollView, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/react';
import ParallaxScrollView from '@/components/ParallaxScrollView';

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
    padding: 10,
    borderRadius: 8,
    minWidth: 50,
    height: 38,
    justifyContent: 'center' as const,
  },
  headerButtonText: {
    color: '#333',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#E8F5F3',
  },
  messageContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
  userMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end' as const,
    marginLeft: 50,
  },
  assistantMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start' as const,
    marginRight: 50,
  },
  messageRole: {
    fontSize: 12,
    marginBottom: 4,
  },
  userRole: {
    color: '#075E54',
  },
  assistantRole: {
    color: '#666',
  },
};

export default function App() {
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId] = useState(`${
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => 
      (c === 'x' ? (Math.random() * 16 | 0) : ((Math.random() * 16 | 0) & 0x3 | 0x8)).toString(16)
  )}`);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setToken(t || ''));
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user' as const, content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Scroll to bottom after user message
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      console.log('Using token:', token ? `Bearer ${token.slice(0, 4)}...` : 'no token');
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
      
      // Scroll to bottom after assistant message appears
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
            // Scroll to bottom after each content update
            scrollViewRef.current?.scrollToEnd({ animated: true });
            break;
          case '2':
            console.log('User message ID:', content);
            break;
          case '8':
            console.log('Server message ID:', content);
            break;
          case 'e':
          case 'd':
            console.log('Stream ended:', content);
            break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GentleGossip</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Talk</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, color: '#666', textAlign: 'center', marginBottom: 20 }}>
              Let's chat about what's on your mind. I'll help you find clarity, motivation, and the strength within yourself.
            </Text>
            <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
              Ready to take the next step? What would you like to talk about today? ✨
            </Text>
          </View>
        )}
        
        {messages.map(m => (
          <View 
            key={m.id} 
            style={[
              styles.messageContainer,
              m.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text 
              style={[
                styles.messageRole,
                m.role === 'user' ? styles.userRole : styles.assistantRole
              ]}
            >
              {m.role}
            </Text>
            <Text style={{ fontSize: 16 }}>{m.content}</Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageContainer, { backgroundColor: '#F0F0F0' }]}>
            <Text>Assistant is typing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={{ flex: 1, fontSize: 16 }}
          placeholder="Send a message..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          autoFocus={true}
        />
      </View>
    </SafeAreaView>
  );
}
