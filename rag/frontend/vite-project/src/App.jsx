import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShoppingBag, Star, Users, DollarSign } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare chat history for backend
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content || (msg.type === 'product' ? `แนะนำสินค้า ${msg.products?.length || 0} รายการสำหรับ "${msg.query_used}"` : 'ตอบคำถาม')
      }));

      const response = await fetch('http://localhost:3000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          history: chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Handle different response types
      let assistantMessage;
      
      if (data.products) {
        // Product response - สร้าง content สำหรับเก็บใน history
        const productSummary = `แนะนำสินค้า ${data.products.length} รายการสำหรับคำค้นหา "${data.query_used}": ${data.products.map(p => p.name).join(', ')}`;
        
        assistantMessage = {
          role: 'assistant',
          content: productSummary, // เก็บ summary สำหรับ history
          products: data.products,
          query_used: data.query_used,
          timestamp: new Date().toISOString(),
          type: 'product'
        };
      } else {
        // Text response
        assistantMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-800 text-lg">{product.name}</h4>
        <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
          <Star className="w-4 h-4 mr-1" />
          {(product.similarity_score * 100).toFixed(0)}%
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-gray-700 mb-2 flex items-center">
            <ShoppingBag className="w-4 h-4 mr-1" />
            ประโยชน์
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {product.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-700 mb-2">แก้ปัญหา</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {product.pain_points_solved.map((point, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-gray-600">
          <DollarSign className="w-4 h-4 mr-1" />
          <span className="font-medium">{product.pricing}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="w-4 h-4 mr-1" />
          <span className="text-sm">{product.target_audience.join(', ')}</span>
        </div>
      </div>
    </div>
  );

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-blue-500' : 'bg-gray-500'
            }`}>
              {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
          </div>
          
          <div className={`rounded-2xl px-4 py-2 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : message.type === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {message.type === 'product' ? (
              <div>
                {message.query_used && (
                  <p className="text-sm opacity-80 mb-3">
                    ค้นหาสินค้าสำหรับ: <em>"{message.query_used}"</em>
                  </p>
                )}
                <p className="mb-4">พบสินค้าที่เหมาะสม {message.products.length} รายการ:</p>
                <div className="space-y-3">
                  {message.products.map((product, idx) => (
                    <ProductCard key={product.id || idx} product={product} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
            
            <div className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <Bot className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
            <p className="text-sm text-gray-500">พร้อมช่วยเหลือและแนะนำสินค้า</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">สวัสดีครับ!</p>
            <p>มีอะไรให้ช่วยไหมครับ? สามารถถามคำถามทั่วไปหรือขอแนะนำสินค้าได้เลย</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex mr-2">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-4 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-4 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-4 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;