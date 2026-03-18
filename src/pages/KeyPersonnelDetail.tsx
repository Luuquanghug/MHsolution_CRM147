import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Edit,
  Mail, 
  Phone, 
  Calendar,
  Building2,
  User,
  Cake,
  FileText,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PersonnelFieldsDisplay } from "@/components/PersonnelFieldsDisplay";

interface KeyPersonnel {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  notes: string | null;
  organization_id: string | null;
  assigned_sales_person_id: string | null;
  created_at: string;
  updated_at: string;
  organizations?: {
    name: string;
    type: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface ContactHistory {
  id: string;
  contact_date: string;
  summary: string;
  contact_method: string;
  outcome: string | null;
  next_action: string | null;
  details: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

const KeyPersonnelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [personnel, setPersonnel] = useState<KeyPersonnel | null>(null);
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageInfo("Chi tiết Nhân sự chủ chốt", "Thông tin chi tiết và lịch sử chăm sóc");
  }, [setPageInfo]);


  useEffect(() => {
    if (user && id) {
      fetchPersonnelDetail();
    }
  }, [user, id]);

  const fetchPersonnelDetail = async () => {
    if (!id) return;
    
    try {
      // Fetch personnel details
      const { data: personnelData, error: personnelError } = await supabase
        .from('key_personnel')
        .select(`
          *,
          organizations (
            name,
            type
          ),
          profiles:assigned_sales_person_id (
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (personnelError) throw personnelError;
      setPersonnel(personnelData);

      // Fetch contact history
      const { data: contactData, error: contactError } = await supabase
        .from('contact_history')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `)
        .eq('personnel_id', id)
        .order('contact_date', { ascending: false });

      if (contactError) throw contactError;
      setContactHistory(contactData || []);

    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin nhân sự",
        variant: "destructive",
      });
      navigate("/key-personnel");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContactMethodLabel = (method: string) => {
    switch (method) {
      case 'phone': return 'Điện thoại';
      case 'email': return 'Email';
      case 'meeting': return 'Gặp mặt';
      case 'social_media': return 'Mạng xã hội';
      default: return 'Khác';
    }
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return Phone;
      case 'email': return Mail;
      case 'meeting': return User;
      case 'social_media': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const groupContactsByTime = (contacts: ContactHistory[]) => {
    const now = new Date();
    const future: ContactHistory[] = [];
    const past: ContactHistory[] = [];

    contacts.forEach(contact => {
      const contactDate = new Date(contact.contact_date);
      if (contactDate > now) {
        future.push(contact);
      } else {
        past.push(contact);
      }
    });

    return { future, past };
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy thông tin nhân sự</h2>
        </div>
      </div>
    );
  }

  const { future: plannedContacts, past: pastContacts } = groupContactsByTime(contactHistory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/key-personnel")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/key-personnel">Nhân sự chủ chốt</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{personnel.full_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button onClick={() => navigate(`/key-personnel/${personnel.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personnel Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={personnel.avatar_url || ""} />
                <AvatarFallback className="text-2xl">
                  {getInitials(personnel.full_name)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{personnel.full_name}</CardTitle>
              {personnel.position && (
                <p className="text-muted-foreground">{personnel.position}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {personnel.organizations && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{personnel.organizations.name}</div>
                    <Badge variant="outline" className="mt-1">
                      {personnel.organizations.type === 'b2b' ? 'B2B' : 'B2G'}
                    </Badge>
                  </div>
                </div>
              )}

              {personnel.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{personnel.email}</span>
                </div>
              )}

              {personnel.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{personnel.phone}</span>
                </div>
              )}

              {personnel.birth_date && (
                <div className="flex items-center gap-3">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  <span>Sinh nhật: {formatDate(personnel.birth_date)}</span>
                </div>
              )}

              {personnel.profiles && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phụ trách</div>
                    <div className="font-medium">{personnel.profiles.full_name}</div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                <div>Tạo: {formatDateTime(personnel.created_at)}</div>
                <div>Cập nhật: {formatDateTime(personnel.updated_at)}</div>
              </div>
            </CardContent>
          </Card>

          {personnel.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{personnel.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Extended Information & Contact History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Extended Information */}
          <PersonnelFieldsDisplay personnelId={personnel.id} />

          {/* Planned Contacts */}
          {plannedContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Kế hoạch chăm sóc ({plannedContacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plannedContacts.map((contact) => {
                  const IconComponent = getContactMethodIcon(contact.contact_method);
                  return (
                    <Card key={contact.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <span className="font-medium">{formatDateTime(contact.contact_date)}</span>
                            <Badge variant="secondary">
                              {getContactMethodLabel(contact.contact_method)}
                            </Badge>
                          </div>
                          {contact.profiles && (
                            <div className="text-sm text-muted-foreground">
                              {contact.profiles.full_name}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Nội dung:</h5>
                            <p className="text-sm">{contact.summary}</p>
                          </div>
                          
                          {contact.details && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Chi tiết:</h5>
                              <p className="text-sm text-muted-foreground">{contact.details}</p>
                            </div>
                          )}
                          
                          {contact.next_action && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Hành động tiếp theo:</h5>
                              <p className="text-sm text-muted-foreground">{contact.next_action}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Past Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lịch sử chăm sóc ({pastContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có lịch sử chăm sóc</p>
                </div>
              ) : (
                pastContacts.map((contact) => {
                  const IconComponent = getContactMethodIcon(contact.contact_method);
                  const hasOutcome = contact.outcome;
                  
                  return (
                    <Card key={contact.id} className={`border-l-4 ${hasOutcome ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDateTime(contact.contact_date)}</span>
                            <Badge variant="outline">
                              {getContactMethodLabel(contact.contact_method)}
                            </Badge>
                            {hasOutcome && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          {contact.profiles && (
                            <div className="text-sm text-muted-foreground">
                              {contact.profiles.full_name}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Nội dung:</h5>
                            <p className="text-sm">{contact.summary}</p>
                          </div>
                          
                          {contact.details && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Chi tiết:</h5>
                              <p className="text-sm text-muted-foreground">{contact.details}</p>
                            </div>
                          )}
                          
                          {contact.outcome && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Kết quả:</h5>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <p className="text-sm text-green-700 dark:text-green-400">{contact.outcome}</p>
                              </div>
                            </div>
                          )}
                          
                          {contact.next_action && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Hành động tiếp theo:</h5>
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                                <p className="text-sm text-orange-700 dark:text-orange-400">{contact.next_action}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KeyPersonnelDetail;