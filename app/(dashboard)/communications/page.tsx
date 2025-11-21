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
  Copy,
  EyeOff,
  Eye,
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
  isDefault: boolean;
  teamId?: string | null;
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
  const [hiddenTemplates, setHiddenTemplates] = useState<MessageTemplate[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isHiddenDialogOpen, setIsHiddenDialogOpen] = useState(false);
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
    fetchHiddenTemplates();
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

  const fetchHiddenTemplates = async () => {
    try {
      const res = await fetch('/api/templates/hidden');
      if (res.ok) {
        const data = await res.json();
        setHiddenTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch hidden templates:', error);
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
      toast.error('Veuillez sélectionner un client et entrer un message');
      return;
    }

    if (commType === 'email' && !subject) {
      toast.error('Veuillez entrer un objet pour l\'email');
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
        toast.success(`${commType === 'email' ? 'Email' : 'SMS'} envoyé avec succès !`);
        setSelectedCustomer('');
        setSubject('');
        setMessage('');
        fetchCommunications();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Échec de l\'envoi du message');
      }
    } catch (error) {
      toast.error('Échec de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.message) {
      toast.error('Veuillez remplir tous les champs requis');
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
            ? 'Modèle mis à jour avec succès !'
            : 'Modèle créé avec succès !'
        );
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', type: 'email', subject: '', message: '' });
        fetchTemplates();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Échec de la sauvegarde du modèle');
      }
    } catch (error) {
      toast.error('Échec de la sauvegarde du modèle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Modèle supprimé avec succès !');
        fetchTemplates();
        fetchHiddenTemplates();
      } else {
        toast.error('Échec de la suppression du modèle');
      }
    } catch (error) {
      toast.error('Échec de la suppression du modèle');
    }
  };

  const handleRestoreTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        toast.success('Template restored successfully!');
        fetchTemplates();
        fetchHiddenTemplates();
      } else {
        toast.error('Failed to restore template');
      }
    } catch (error) {
      toast.error('Failed to restore template');
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    // Cannot edit default templates
    if (template.isDefault) {
      toast.error('Cannot edit default templates. Use the template as-is or create a custom one.');
      return;
    }

    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      message: template.message,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    setEditingTemplate(null); // Not editing, creating new
    setTemplateForm({
      name: `${template.name} (Copy)`,
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
    toast.success('Modèle chargé !');
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
          Envoyer des emails et SMS à vos clients
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">Total envoyés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <p className="text-xs text-muted-foreground">Livrés</p>
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
            <p className="text-xs text-muted-foreground">Messages SMS</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Composer
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Mes modèles ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Inbox className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Compose Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Envoyer un message</CardTitle>
                <CardDescription>
                  Envoyer un email ou SMS à vos clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de message</Label>
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
                  <Label htmlFor="customer">Destinataire</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Sélectionner un client" />
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
                    <Label htmlFor="subject">Objet</Label>
                    <Input
                      id="subject"
                      placeholder="Objet de l'email..."
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
                        ? 'Composez votre email...'
                        : 'Composez votre SMS (max 160 caractères)...'
                    }
                    rows={commType === 'email' ? 10 : 4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={commType === 'sms' ? 160 : undefined}
                  />
                  {commType === 'sms' && (
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/160 caractères
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
                  Envoyer {commType === 'email' ? 'l\'email' : 'le SMS'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Accès rapide</CardTitle>
                <CardDescription>Vos modèles enregistrés</CardDescription>
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
                    Aucun modèle pour le moment. Créez-en un dans l'onglet Modèles !
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
                  <CardTitle>Modèles de messages</CardTitle>
                  <CardDescription>
                    Créer et gérer vos modèles de messages
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
                      Nouveau modèle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Modifier le modèle' : 'Créer un modèle'}
                      </DialogTitle>
                      <DialogDescription>
                        Créer un modèle de message réutilisable pour une communication rapide
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Nom du modèle</Label>
                        <Input
                          id="template-name"
                          placeholder="ex: Confirmation de réservation"
                          value={templateForm.name}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type de message</Label>
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
                          <Label htmlFor="template-subject">Objet</Label>
                          <Input
                            id="template-subject"
                            placeholder="Objet de l'email..."
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
                          placeholder="Votre modèle de message..."
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
                            {templateForm.message.length}/160 caractères
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleSaveTemplate} disabled={loading}>
                        {editingTemplate ? 'Mettre à jour' : 'Créer'} le modèle
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
                    <h3 className="text-xl font-semibold mb-2">Aucun modèle pour le moment</h3>
                    <p className="text-muted-foreground mb-4">
                      Créez votre premier modèle de message pour commencer
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
                            {template.isDefault && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                Default
                              </Badge>
                            )}
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
                              Utiliser le modèle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}

                {/* Hidden Templates Section */}
                {hiddenTemplates.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Hidden Default Templates</h3>
                        <p className="text-sm text-muted-foreground">
                          Restore templates to use them again
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchHiddenTemplates();
                          setIsHiddenDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Hidden ({hiddenTemplates.length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hidden Templates Dialog */}
          <Dialog open={isHiddenDialogOpen} onOpenChange={setIsHiddenDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Hidden Default Templates</DialogTitle>
                <DialogDescription>
                  Restore templates to make them visible again
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {hiddenTemplates.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No hidden templates
                  </p>
                ) : (
                  hiddenTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 flex items-start justify-between"
                    >
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleRestoreTemplate(template.id);
                          if (hiddenTemplates.length === 1) {
                            setIsHiddenDialogOpen(false);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des communications</CardTitle>
              <CardDescription>Tous les messages envoyés et leur statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucun message envoyé pour le moment
                    </h3>
                    <p className="text-muted-foreground">
                      Commencez à communiquer avec vos clients !
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
                              {new Date(comm.createdAt).toLocaleDateString('fr-FR', {
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
                              {comm.status === 'delivered' ? 'Livré' : comm.status === 'sent' ? 'Envoyé' : comm.status === 'pending' ? 'En attente' : 'Échec'}
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
