import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { MessageCircle, Send, PhoneOff, Loader2, User } from 'lucide-react';
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
  userId?: string;
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
  return [...userRows, ...adminRows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function AdminSupport() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selected, setSelected] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
    try {
      const data = (await api.support.listChats()) as SupportChat[];
      setChats(Array.isArray(data) ? data : []);
      if (selected) {
        const updated = data.find((c) => c._id === selected._id);
        if (updated) setSelected(updated);
        else setSelected(null);
      }
    } catch {
      setChats([]);
      if (selected) setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [selected?._id]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const t = setInterval(fetchChats, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.userMessages?.length, selected?.adminMessages?.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const updated = await api.support.sendAdminMessage(selected._id, text);
      setSelected(updated as SupportChat);
      setInput('');
      await fetchChats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!selected || ending) return;
    setEnding(true);
    try {
      await api.support.endChat(selected._id);
      setSelected(null);
      await fetchChats();
      toast.success('Chat ended. Messages have been deleted.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to end chat');
    } finally {
      setEnding(false);
    }
  };

  const messages = selected ? mergeMessages(selected) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">Support</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)] min-h-[400px]">
        <Card className="glass-card p-2 overflow-hidden flex flex-col">
          <p className="text-sm font-medium px-2 py-2 text-muted-foreground">Chats by user</p>
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-1 pr-2">
                {chats.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">No active chats</p>
                )}
                {chats.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setSelected(c)}
                    className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors ${
                      selected?._id === c._id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{c.userEmail}</span>
                    <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                      {(c.userMessages?.length || 0) + (c.adminMessages?.length || 0)}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        <Card className="md:col-span-2 glass-card overflow-hidden flex flex-col">
          {!selected ? (
            <div className="p-8 flex flex-col items-center justify-center gap-4 flex-1">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">Select a chat to view and reply</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selected.userEmail}</span>
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

              <ScrollArea className="flex-1 p-4 min-h-[240px]">
                <div className="space-y-3 pr-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 ${
                          m.isUser ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm font-medium mb-0.5">{m.isUser ? selected.userEmail : 'You'}</p>
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
                  placeholder="Type your reply..."
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
    </div>
  );
}
