import { generateAPIUrl } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import { View, TextInput, ScrollView, Text, SafeAreaView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/react';
import ParallaxScrollView from '@/components/ParallaxScrollView';

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
    <SafeAreaView style={{ height: '100%' }}>
      <View style={{ height: '95%', display: 'flex', flexDirection: 'column', paddingHorizontal: 8 }}>
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(m => (
            <View key={m.id} style={{ marginVertical: 8 }}>
              <View>
                <Text style={{ fontWeight: 700 }}>{m.role}</Text>
                <Text>{m.content}</Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={{ padding: 8, backgroundColor: '#f0f0f0', margin: 8, borderRadius: 8 }}>
              <Text>Assistant is typing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={{ marginTop: 8 }}>
          <TextInput
            style={{ backgroundColor: 'white', padding: 8 }}
            placeholder="Say something..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            autoFocus={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
