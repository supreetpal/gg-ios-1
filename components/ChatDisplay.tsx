import { View, ScrollView, Text } from 'react-native';
import { Message } from '@ai-sdk/react';
import { useRef } from 'react';

const styles = {
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
};

interface ChatDisplayProps {
  messages: Message[];
  isTyping: boolean;
}

export default function ChatDisplay({ messages, isTyping }: ChatDisplayProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={{ flex: 1 }}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.length === 0 && (
        <View style={[styles.messageContainer, { marginTop: 20, paddingVertical: 24 }]}>
          <Text style={{ 
            fontSize: 24, 
            color: '#00A884', 
            textAlign: 'center', 
            marginBottom: 16,
            fontWeight: '600'
          }}>
            Welcome!
          </Text>
          <Text style={{ 
            fontSize: 18, 
            color: '#666', 
            textAlign: 'center', 
            marginBottom: 20,
            lineHeight: 24
          }}>
            Let's chat about what's on your mind. I'll help you find clarity, motivation, and the strength within yourself.
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#666', 
            textAlign: 'center',
            lineHeight: 22
          }}>
            Ready to take the next step?{'\n'}
            What would you like to talk about today? ✨
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
          <Text style={{ fontSize: 16 }}>{m.content}</Text>
        </View>
      ))}
      
      {isTyping && (
        <View style={[styles.messageContainer, styles.assistantMessage]}>
          <Text>Thinking...</Text>
        </View>
      )}
    </ScrollView>
  );
}
