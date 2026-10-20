import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, PhoneOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ChatMessage = {
  content: string;
  createdAt: string;
  adminId?: string;
};

type SupportChat = {
  _id: string;
  userEmail: string;
  userMessages: ChatMessage[];
  adminMessages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const POLL_INTERVAL_MS = 4000;

function mergeMessages(chat: SupportChat): { content: string; createdAt: string; isUser: boolean }[] {
  const userRows = (chat.userMessages || []).map((m) => ({
    content: m.content,
    createdAt: m.createdAt,
    isUser: true,
  }));
  const adminRows = (chat.adminMessages || []).map((m) => ({
    content: m.content,
    createdAt: m.createdAt,
    isUser: false,
  }));
  const merged = [...userRows, ...adminRows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return merged;
}

export default function Support() {
  const { user } = useAuth();
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChat = useCallback(async () => {
    try {
      const data = await api.support.getMyChat();
      setChat(data as SupportChat);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setChat(null);
        return;
      }
      setChat(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    if (!chat) return;
    const t = setInterval(fetchChat, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [chat, fetchChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.userMessages?.length, chat?.adminMessages?.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const updated = await api.support.sendMessage(text);
      setChat(updated as SupportChat);
      setInput('');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEndChat = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await api.support.endMyChat();
      setChat(null);
      toast.success('Chat ended. You can start a new one anytime.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to end chat');
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const messages = chat ? mergeMessages(chat) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">Support</h1>
      </div>

      <Card className="glass-card overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]">
        {!chat ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[320px]">
            <MessageCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Start a conversation with support. You can ask about your account, limits, or transfers.
            </p>
            <Button
              onClick={async () => {
                try {
                  const data = await api.support.startChat();
                  setChat(data as SupportChat);
                } catch (e) {
                  toast.error(e instanceof ApiError ? e.message : 'Failed to start chat');
                }
              }}
              disabled={loading}
            >
              Start chat
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Support chat</span>
                <span className="text-sm text-muted-foreground">({user?.email})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleEndChat}
                disabled={ending}
              >
                {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4 mr-1" />}
                End chat
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4 min-h-[280px] max-h-[400px]">
              <div className="space-y-3 pr-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Say hello!</p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        m.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm font-medium mb-0.5">{m.isUser ? 'You' : 'Support'}</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-xs opacity-80 mt-1">
                        {format(new Date(m.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
