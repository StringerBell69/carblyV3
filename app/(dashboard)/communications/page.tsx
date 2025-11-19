'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  MessageSquare,
  Send,
  Inbox,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

type MessageType = 'email' | 'sms';
type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

interface MessageTemplate {
  id: string;
  name: string;
  type: MessageType;
  subject?: string | null;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Customer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

interface Communication {
  id: string;
  type: MessageType;
  subject?: string | null;
  message: string;
  status: CommunicationStatus;
  sentAt?: Date | null;
  customer: Customer;
  createdAt: Date;
}

export default function CommunicationsPage() {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [commType, setCommType] = useState<MessageType>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'email' as MessageType,
    subject: '',
    message: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchTemplates();
    fetchCommunications();
    fetchCustomers();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchCommunications = async () => {
    try {
      const res = await fetch('/api/communications');
      if (res.ok) {
        const data = await res.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedCustomer || !message) {
      toast.error('Please select a customer and enter a message');
      return;
    }

    if (commType === 'email' && !subject) {
      toast.error('Please enter a subject for the email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          type: commType,
          subject: commType === 'email' ? subject : null,
          message,
        }),
      });

      if (res.ok) {
        toast.success(`${commType === 'email' ? 'Email' : 'SMS'} sent successfully!`);
        setSelectedCustomer('');
        setSubject('');
        setMessage('');
        fetchCommunications();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });

      if (res.ok) {
        toast.success(
          editingTemplate
            ? 'Template updated successfully!'
            : 'Template created successfully!'
        );
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', type: 'email', subject: '', message: '' });
        fetchTemplates();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save template');
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template deleted successfully!');
        fetchTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      message: template.message,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setCommType(template.type);
    setSubject(template.subject || '');
    setMessage(template.message);
    toast.success('Template loaded!');
  };

  const stats = {
    totalSent: communications.length,
    delivered: communications.filter((c) => c.status === 'delivered').length,
    emails: communications.filter((c) => c.type === 'email').length,
    sms: communications.filter((c) => c.type === 'sms').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Communications
        </h1>
        <p className="text-muted-foreground mt-1">
          Send emails and SMS to your customers
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Total Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.emails}</div>
            <p className="text-xs text-muted-foreground">Emails</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.sms}</div>
            <p className="text-xs text-muted-foreground">SMS Messages</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            My Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Inbox className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Compose Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
                <CardDescription>
                  Send email or SMS to your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={commType === 'email' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setCommType('email')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      variant={commType === 'sms' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setCommType('sms')}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      SMS
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Recipient</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {commType === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder={
                      commType === 'email'
                        ? 'Compose your email...'
                        : 'Compose your SMS (max 160 characters)...'
                    }
                    rows={commType === 'email' ? 10 : 4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={commType === 'sms' ? 160 : undefined}
                  />
                  {commType === 'sms' && (
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/160 characters
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSendMessage}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send {commType === 'email' ? 'Email' : 'SMS'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Your saved templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.slice(0, 4).map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {template.type === 'email' ? (
                          <Mail className="h-3.5 w-3.5" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5" />
                        )}
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {template.message.substring(0, 50)}...
                      </p>
                    </div>
                  </Button>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No templates yet. Create one in the Templates tab!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>
                    Create and manage your message templates
                  </CardDescription>
                </div>
                <Dialog
                  open={isTemplateDialogOpen}
                  onOpenChange={(open) => {
                    setIsTemplateDialogOpen(open);
                    if (!open) {
                      setEditingTemplate(null);
                      setTemplateForm({
                        name: '',
                        type: 'email',
                        subject: '',
                        message: '',
                      });
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Edit Template' : 'Create Template'}
                      </DialogTitle>
                      <DialogDescription>
                        Create a reusable message template for quick communication
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          placeholder="e.g., Booking Confirmation"
                          value={templateForm.name}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              templateForm.type === 'email' ? 'default' : 'outline'
                            }
                            className="flex-1"
                            onClick={() =>
                              setTemplateForm({ ...templateForm, type: 'email' })
                            }
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </Button>
                          <Button
                            type="button"
                            variant={
                              templateForm.type === 'sms' ? 'default' : 'outline'
                            }
                            className="flex-1"
                            onClick={() =>
                              setTemplateForm({ ...templateForm, type: 'sms' })
                            }
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            SMS
                          </Button>
                        </div>
                      </div>
                      {templateForm.type === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="template-subject">Subject</Label>
                          <Input
                            id="template-subject"
                            placeholder="Email subject..."
                            value={templateForm.subject}
                            onChange={(e) =>
                              setTemplateForm({
                                ...templateForm,
                                subject: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="template-message">Message</Label>
                        <Textarea
                          id="template-message"
                          placeholder="Your message template..."
                          rows={8}
                          value={templateForm.message}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              message: e.target.value,
                            })
                          }
                          maxLength={templateForm.type === 'sms' ? 160 : undefined}
                        />
                        {templateForm.type === 'sms' && (
                          <p className="text-xs text-muted-foreground text-right">
                            {templateForm.message.length}/160 characters
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate} disabled={loading}>
                        {editingTemplate ? 'Update' : 'Create'} Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first message template to get started
                    </p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="outline">
                              {template.type.toUpperCase()}
                            </Badge>
                          </div>
                          {template.subject && (
                            <p className="text-sm font-medium mb-1">
                              {template.subject}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.message}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUseTemplate(template)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Use Template
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>All sent messages and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      No messages sent yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start communicating with your customers!
                    </p>
                  </div>
                ) : (
                  communications
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((comm) => (
                      <div key={comm.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {comm.type === 'email' ? (
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {comm.customer.firstName} {comm.customer.lastName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comm.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(comm.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                              })}
                            </span>
                            <Badge
                              className={
                                comm.status === 'delivered'
                                  ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                                  : comm.status === 'sent'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                              }
                            >
                              {comm.status}
                            </Badge>
                          </div>
                        </div>
                        {comm.subject && (
                          <p className="font-medium text-sm mb-2">{comm.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{comm.message}</p>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
