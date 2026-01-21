import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

export default function Notifications() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    userIds: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      const userIds = formData.userIds.trim()
        ? formData.userIds.split(',').map(id => id.trim()).filter(Boolean)
        : undefined;

      await api.admin.sendNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        userIds,
      });

      toast.success('Notification sent successfully');
      setFormData({
        title: '',
        message: '',
        type: 'info',
        userIds: '',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to send notification');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Send Notification</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userIds">User IDs (Optional)</Label>
            <Input
              id="userIds"
              placeholder="Enter user IDs separated by commas (leave empty to send to all users)"
              value={formData.userIds}
              onChange={(e) => setFormData({ ...formData, userIds: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to send notification to all users, or enter specific user IDs separated by commas
            </p>
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

