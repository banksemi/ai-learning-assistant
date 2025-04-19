import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useLanguage } from '../contexts/LanguageContext';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { chatWithAI } from '../services/api'; // Import chat API function

// Reusable CodeBlock component definition (remains the same)
const CodeBlock = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code className={`${className} bg-gray-200 text-sm px-1 py-0.5 rounded font-mono`} {...props}>
                {children}
            </code>
        );
    },
};

const ChatOverlay = ({ isOpen, onClose, currentQuestion, examId }) => { // Added examId prop
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false); // Loading state for AI response
  const [error, setError] = useState(''); // Error state for chat
  const messagesEndRef = useRef(null); // Ref for scrolling

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when the overlay is opened or question changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        { id: Date.now(), sender: 'ai', text: t('chatWelcome') }
      ]);
      setInputValue('');
      setError(''); // Clear error on open
      setIsLoadingAI(false); // Reset loading state
    }
  }, [isOpen, currentQuestion, t]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessageText = inputValue.trim();
    if (!userMessageText || isLoadingAI || !examId || !currentQuestion?.id) return;

    setError(''); // Clear previous errors
    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      text: userMessageText,
    };

    // Add user message and clear input
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoadingAI(true); // Start loading

    try {
      // Call the chatWithAI API
      const aiResponseText = await chatWithAI(examId, currentQuestion.id, userMessageText);

      const aiResponse = {
        id: Date.now() + 1, // Ensure unique ID
        sender: 'ai',
        text: aiResponseText,
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

    } catch (err) {
      console.error("Error chatting with AI:", err);
      setError(t('errorChattingAI') || 'Failed to get response from AI. Please try again.'); // Add translation key
      // Optionally add an error message to the chat
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Error: ${t('errorChattingAI') || 'Failed to get response.'}`,
        isError: true, // Custom flag for styling
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsLoadingAI(false); // Stop loading
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md h-[75vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-textPrimary">{t('askAI')}</h3>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'items-start space-x-2'}`}>
              {/* AI Icon */}
              {message.sender === 'ai' && (
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <FaWandMagicSparkles className={` ${message.isError ? 'text-red-500' : 'text-primary'}`} size={20} />
                </div>
              )}
              {/* Message Bubble */}
              <div className={`p-3 rounded-lg max-w-[85%] ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-700' // Style for error messages
                    : 'bg-gray-100 text-textPrimary'
                }`}
              >
                {/* Render message text using ReactMarkdown */}
                <ReactMarkdown components={CodeBlock} className="text-sm leading-relaxed">
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {/* Loading Indicator */}
          {isLoadingAI && (
             <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <FaWandMagicSparkles className="text-primary animate-pulse" size={20} />
                </div>
                <div className="p-3 rounded-lg max-w-[85%] bg-gray-100 text-textPrimary">
                    <span className="italic text-sm">AI is thinking...</span>
                </div>
             </div>
          )}
           {/* Add a reference div at the end for scrolling */}
           <div ref={messagesEndRef}></div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              name="message"
              placeholder={t('typeAnswer')}
              className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:bg-gray-100"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoadingAI} // Disable input while AI is loading
            />
            <button
              type="submit"
              className="bg-primary text-white p-2 rounded-full hover:bg-indigo-700 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
              disabled={!inputValue.trim() || isLoadingAI} // Disable button if input is empty or AI loading
            >
              {isLoadingAI ? (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                 <FaPaperPlane size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;
