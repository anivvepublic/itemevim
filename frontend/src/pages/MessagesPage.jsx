import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Send, 
  Check, CheckCheck, MessageCircle,
  User, Clock, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('to');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [initializingChat, setInitializingChat] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('BaÄŸlanÄ±yor...');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const channelRef = useRef(null);
  const lastSeenIntervalRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const chatContainerRef = useRef(null);

  // KullanÄ±cÄ± oturumu
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setCurrentUser(session.user);

      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('username', session.user.email.split('@')[0])
        .limit(1);

      if (users && users.length > 0) {
        setCurrentUserId(users[0].id);
      }
    };

    checkAuth();
  }, [navigate]);

  // KonuÅŸmalarÄ± yÃ¼kle
  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
  }, [currentUserId]);

  // URL'den gelen kullanÄ±cÄ± ile sohbet baÅŸlat
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    if (conversations.length === 0 && loading) return;
    if (targetUserId === currentUserId) return;

    const existingConv = conversations.find(c => c.user?.id === targetUserId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      setIsMobileChatOpen(true);
    } else {
      initializeNewChat(targetUserId);
    }
  }, [currentUserId, targetUserId, conversations, loading]);

  const initializeNewChat = async (userId) => {
    setInitializingChat(true);
    try {
      const res = await fetch(`/api/users/${userId}/info`);
      if (!res.ok) throw new Error('KullanÄ±cÄ± bulunamadÄ±');
      const userInfo = await res.json();
      
      const newConversation = {
        user: userInfo,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        listing: null,
        unreadCount: 0,
        isNew: true
      };
      
      setSelectedConversation(newConversation);
      setOtherUserInfo(userInfo);
      setMessages([]);
      setIsMobileChatOpen(true);
    } catch (err) {
      console.error('Initialize chat error:', err);
      addToast('KullanÄ±cÄ± bulunamadÄ±', 'error');
    } finally {
      setInitializingChat(false);
    }
  };

  // Real-time mesaj dinleme
  useEffect(() => {
    if (!currentUserId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-room-${currentUserId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new || payload.old;
          if (!newMsg) return;
          
          const isForMe = newMsg.receiver_id === currentUserId || newMsg.sender_id === currentUserId;
          
          if (isForMe) {
            const currentSelected = selectedConversationRef.current;
            
            if (currentSelected && 
                (newMsg.sender_id === currentSelected.user?.id || 
                 newMsg.receiver_id === currentSelected.user?.id)) {
              
              if (payload.eventType === 'INSERT') {
                setMessages(prev => {
                  const exists = prev.find(m => m.id === newMsg.id);
                  if (exists) return prev;
                  return [...prev, newMsg];
                });
                
                if (newMsg.receiver_id === currentUserId && !newMsg.is_read) {
                  markMessageAsRead(newMsg.id);
                }
              } else if (payload.eventType === 'UPDATE') {
                setMessages(prev => prev.map(m => 
                  m.id === newMsg.id ? { ...m, ...newMsg } : m
                ));
              }
            }
            
            loadConversations();
          }
        }
      )
      .subscribe((status, err) => {
        setRealtimeStatus(status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId]);

  // selectedConversation deÄŸiÅŸtiÄŸinde ref'i gÃ¼ncelle ve mesajlarÄ± yÃ¼kle
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    
    if (selectedConversation && currentUserId) {
      const otherUserId = selectedConversation.user?.id;
      if (!otherUserId) return;

      const loadMessages = async () => {
        try {
          const res = await fetch(`/api/messages/${currentUserId}/${otherUserId}`);
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
          
          const infoRes = await fetch(`/api/users/${otherUserId}/info`);
          const infoData = await infoRes.json();
          setOtherUserInfo(infoData);
        } catch (err) {
          console.error('Messages load error:', err);
        }
      };

      loadMessages();
    }
  }, [selectedConversation, currentUserId]);

  // Son gÃ¶rÃ¼lme gÃ¼ncelleme
  useEffect(() => {
    if (!currentUserId) return;

    const updateLastSeen = async () => {
      try {
        await fetch(`/api/users/${currentUserId}/last-seen`, {
          method: 'PUT'
        });
      } catch (err) {
        console.error('Last seen update error:', err);
      }
    };

    updateLastSeen();
    lastSeenIntervalRef.current = setInterval(updateLastSeen, 30000);

    return () => {
      if (lastSeenIntervalRef.current) {
        clearInterval(lastSeenIntervalRef.current);
      }
    };
  }, [currentUserId]);

  // Otomatik scroll
  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const loadConversations = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/messages/conversations/${currentUserId}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Conversations load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: selectedConversation.user?.id,
          listing_id: selectedConversation.listing?.id || null,
          content: messageText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mesaj gÃ¶nderilemedi');

      setMessages(prev => [...prev, {
        ...data,
        sender_id: currentUserId,
        receiver_id: selectedConversation.user?.id,
        content: messageText,
        created_at: new Date().toISOString(),
        is_read: false
      }]);
      
      loadConversations();
    } catch (err) {
      addToast(err.message, 'error');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setIsMobileChatOpen(true);
    
    if (targetUserId) {
      navigate('/messages', { replace: true });
    }
  };

  const handleViewProfile = () => {
    if (selectedConversation?.user?.username) {
      navigate(`/u/${selectedConversation.user.username}`);
    }
  };

  // Profil fotoÄŸrafÄ± helper'Ä±
  const getAvatarUrl = (user) => {
    if (!user) return null;
    return user.avatar_url || user.avatar || null;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Åžimdi';
    if (minutes < 60) return `${minutes} dk`;
    if (hours < 24) return `${hours} sa`;
    if (days < 7) return `${days} gÃ¼n`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastSeenText = (lastSeen) => {
    if (!lastSeen) return 'Bilinmiyor';
    
    const d = new Date(lastSeen);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 5) return 'Ã‡evrimiÃ§i';
    if (minutes < 60) return `${minutes} dakika Ã¶nce`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} saat Ã¶nce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted mt-4">YÃ¼kleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* Realtime Durumu */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${
          realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' :
          realtimeStatus === 'CHANNEL_ERROR' ? 'bg-red-500' :
          'bg-yellow-500'
        }`}></div>
        <span className="text-text-muted">Realtime: <span className="text-white font-medium">{realtimeStatus}</span></span>
      </div>

      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
        <div className="flex h-full">
          {/* SOL PANEL */}
          <div className={`w-full md:w-96 border-r border-dark-700 flex flex-col ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-dark-700">
              <h1 className="text-xl font-bold text-white mb-3">Mesajlar</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="KonuÅŸma ara..."
                  className="w-full bg-dark-900 text-white pl-10 pr-4 py-2.5 rounded-lg border border-dark-700 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading || initializingChat ? (
                <div className="text-center py-16">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-text-muted text-sm">
                    {searchQuery ? 'SonuÃ§ bulunamadÄ±' : 'HenÃ¼z konuÅŸma yok'}
                  </p>
                  <p className="text-text-muted text-xs mt-2">
                    Bir ilandan "Mesaj GÃ¶nder" butonuna tÄ±klayarak baÅŸlayabilirsin
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv, index) => {
                  const avatarUrl = getAvatarUrl(conv.user);
                  return (
                    <button
                      key={conv.user?.id || index}
                      onClick={() => handleConversationClick(conv)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0 ${
                        selectedConversation?.user?.id === conv.user?.id ? 'bg-dark-700' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={conv.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-600/30">
                              <span className="text-white font-bold text-sm">
                                {conv.user?.username?.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold text-sm truncate">
                            {conv.user?.username || 'KullanÄ±cÄ±'}
                          </span>
                          <span className="text-text-muted text-xs flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-text-muted text-xs truncate">
                          {conv.lastMessage || 'HenÃ¼z mesaj yok'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SAÄž PANEL */}
          <div className={`flex-1 flex flex-col ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
                  <p className="text-text-muted text-lg">Bir konuÅŸma seÃ§in</p>
                  <p className="text-text-muted text-sm mt-2">Sol panelden bir konuÅŸma seÃ§in veya bir ilandan mesaj gÃ¶nderin</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header - MOBÄ°L Ä°Ã‡Ä°N TEMÄ°ZLENDÄ° */}
                <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => setIsMobileChatOpen(false)}
                      className="md:hidden text-text-muted hover:text-white flex-shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    {/* Avatar - Profil fotoÄŸrafÄ± varsa gÃ¶ster */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 flex-shrink-0">
                      {otherUserInfo && getAvatarUrl(otherUserInfo) ? (
                        <img src={getAvatarUrl(otherUserInfo)} alt={otherUserInfo.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-600/30">
                          <span className="text-white font-bold text-xs">
                            {selectedConversation.user?.username?.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {selectedConversation.user?.username}
                      </h3>
                      <p className="text-text-muted text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{getLastSeenText(otherUserInfo?.last_seen)}</span>
                      </p>
                    </div>
                  </div>

                  {/* SaÄŸ taraf - Sadece "Profili GÃ¶r" butonu */}
                  <button
                    onClick={handleViewProfile}
                    className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-text-muted hover:text-white text-xs font-medium flex-shrink-0 ml-2"
                    title="Profili GÃ¶r"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Profili GÃ¶r</span>
                  </button>
                </div>

                {/* Mesajlar */}
                <div ref={chatContainerRef} className="flex-1 overflow-auto p-4 space-y-3 bg-dark-900/30">
                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-dark-700">
                        {otherUserInfo && getAvatarUrl(otherUserInfo) ? (
                          <img src={getAvatarUrl(otherUserInfo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-600/30">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-white font-medium">
                        {selectedConversation.user?.username} ile konuÅŸma baÅŸlattÄ±n
                      </p>
                      <p className="text-text-muted text-sm mt-2">Ä°lk mesajÄ± sen gÃ¶nder!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwn = msg.sender_id === currentUserId;
                      const showTime = index === 0 || 
                        new Date(messages[index - 1].created_at).getDate() !== new Date(msg.created_at).getDate();
                      
                      return (
                        <div key={msg.id || index}>
                          {showTime && (
                            <div className="text-center my-4">
                              <span className="text-text-muted text-xs bg-dark-800 px-3 py-1 rounded-full">
                                {new Date(msg.created_at).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl ${
                                isOwn 
                                  ? 'bg-primary text-white rounded-br-md' 
                                  : 'bg-dark-700 text-white rounded-bl-md'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-text-muted text-[10px]">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {isOwn && (
                                  msg.is_read ? (
                                    <CheckCheck className="w-3 h-3 text-primary" />
                                  ) : (
                                    <Check className="w-3 h-3 text-text-muted" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input AlanÄ± */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-700 bg-dark-800">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`${selectedConversation.user?.username} kiÅŸisine mesaj yaz...`}
                      className="flex-1 bg-dark-900 text-white px-4 py-2.5 rounded-full border border-dark-700 focus:outline-none focus:border-primary text-sm"
                      disabled={sending}
                    />
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white rounded-full transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}