import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare,
  Users2,
  ExternalLink,
  Clock,
  Target,
  Edit,
  User,
  Filter,
  Video,
  Handshake
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ContactHistory {
  id: string;
  personnel_id: string;
  contact_method: string;
  contact_date: string;
  summary: string;
  details: string | null;
  outcome: string | null;
  next_action: string | null;
  created_by: string;
  key_personnel: {
    full_name: string;
    position: string | null;
    avatar_url: string | null;
    organizations: {
      name: string;
      type: string;
    } | null;
  };
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  contact_history_participants?: {
    sales_person_id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  }[];
}

interface KeyPersonnel {
  id: string;
  full_name: string;
  position: string | null;
  avatar_url: string | null;
  organizations: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface SalesOpportunity {
  id: string;
  stage: string;
  negotiated_price: number | null;
  notes: string | null;
  products: {
    name: string;
  } | null;
}

interface SalesPerson {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const CareSchedule = () => {
  const { user, loading } = useAuth();
  const { role, isAdmin, isSalesPerson } = useRole();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);
  const [keyPersonnel, setKeyPersonnel] = useState<KeyPersonnel[]>([]);
  const [salesOpportunities, setSalesOpportunities] = useState<SalesOpportunity[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactHistory | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactDate, setContactDate] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [outcome, setOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  
  // Filter states
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Sales opportunity fields
  const [opportunityStage, setOpportunityStage] = useState("");
  const [opportunityPrice, setOpportunityPrice] = useState("");
  const [opportunityNotes, setOpportunityNotes] = useState("");

  // Form data for admin features
  const [formData, setFormData] = useState({
    assigned_sales_person_id: ""
  });

  // Sales people list for admin
  const [salesPeople, setSalesPeople] = useState<{id: string, full_name: string, user_roles: string}[]>([]);

  useEffect(() => {
    setPageInfo("Lịch Làm việc", "Quản lý và theo dõi các hoạt động làm việc với khách hàng");
  }, [setPageInfo]);


  useEffect(() => {
    if (user && role) {
      fetchContactHistory();
      fetchKeyPersonnel();
      if (isAdmin) {
        fetchSalesPersons();
        fetchSalesPeople();
      }
    }
  }, [user, role]);

  useEffect(() => {
    if (user && role) {
      fetchContactHistory();
    }
  }, [selectedSalesPerson, selectedMonth]);

  const fetchContactHistory = async () => {
    try {
      let query = supabase
        .from('contact_history')
        .select(`
          *,
          key_personnel (
            full_name,
            position,
            avatar_url,
            organizations (
              name,
              type
            )
          ),
          profiles:created_by (
            full_name,
            avatar_url
          ),
          contact_history_participants (
            sales_person_id,
            profiles:sales_person_id (
              full_name,
              avatar_url
            )
          )
        `);

      // Role-based filtering
      if (isSalesPerson) {
        // Sales person only sees their own records
        query = query.eq('created_by', user?.id);
      } else if (isAdmin) {
        // Admin can see all or filter by specific sales person
        if (selectedSalesPerson !== "all") {
          query = query.eq('created_by', selectedSalesPerson);
        }
      }

      const { data, error } = await query.order('contact_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure participants is always an array
      const transformedData = data?.map(item => ({
        ...item,
        contact_history_participants: Array.isArray(item.contact_history_participants) 
          ? item.contact_history_participants 
          : []
      })) || [];
      
      setContactHistory(transformedData as ContactHistory[]);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử làm việc",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_roles')
        .in('user_roles', ['admin', 'sales_person'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setSalesPeople(data || []);
      
      // Set default to current user for admin
      if (isAdmin && user?.id) {
        setFormData(prev => ({ ...prev, assigned_sales_person_id: user.id }));
      }
    } catch (error) {
      console.error('Error fetching sales people:', error);
    }
  };

  const fetchSalesPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('user_roles', ['admin', 'sales_person'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setSalesPersons(data || []);
    } catch (error) {
      console.error('Error fetching sales persons:', error);
    }
  };

  const fetchKeyPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('key_personnel')
        .select(`
          id,
          full_name,
          position,
          avatar_url,
          organizations (
            id,
            name,
            type
          )
        `)
        .order('full_name');

      if (error) throw error;
      setKeyPersonnel(data || []);
    } catch (error) {
      console.error('Error fetching key personnel:', error);
    }
  };

  const fetchSalesOpportunities = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_funnel')
        .select(`
          id,
          stage,
          negotiated_price,
          notes,
          products (name)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalesOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching sales opportunities:', error);
      setSalesOpportunities([]);
    }
  };

  const handlePersonnelChange = (personnelId: string) => {
    setSelectedPersonnel(personnelId);
    setSelectedOpportunity("");
    setOpportunityStage("");
    setOpportunityPrice("");
    setOpportunityNotes("");
    setSalesOpportunities([]);
    
    const selectedPerson = keyPersonnel.find(p => p.id === personnelId);
    if (selectedPerson?.organizations?.id) {
      fetchSalesOpportunities(selectedPerson.organizations.id);
    }
  };

  const handleOpportunityChange = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    
    const opportunity = salesOpportunities.find(o => o.id === opportunityId);
    if (opportunity) {
      setOpportunityStage(opportunity.stage);
      setOpportunityPrice(opportunity.negotiated_price?.toString() || "");
      setOpportunityNotes(opportunity.notes || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersonnel || !contactMethod || !contactDate || !summary) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contact_history')
          .update({
            personnel_id: selectedPersonnel,
            contact_method: contactMethod as any,
            contact_date: new Date(contactDate).toISOString(),
            summary,
            details: details || null,
            outcome: outcome || null,
            next_action: nextAction || null,
            sales_opportunity_id: selectedOpportunity || null,
          })
          .eq('id', editingContact.id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã cập nhật lịch làm việc",
        });
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contact_history')
          .insert({
            personnel_id: selectedPersonnel,
            contact_method: contactMethod as any,
            contact_date: new Date(contactDate).toISOString(),
            summary,
            details: details || null,
            outcome: outcome || null,
            next_action: nextAction || null,
            sales_opportunity_id: selectedOpportunity || null,
            created_by: isAdmin && formData.assigned_sales_person_id ? formData.assigned_sales_person_id : user?.id,
          });

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã thêm lịch làm việc mới",
        });
      }

      // Update sales opportunity if selected
      if (selectedOpportunity && (opportunityStage || opportunityPrice || opportunityNotes)) {
        const updateData: any = {};
        if (opportunityStage) updateData.stage = opportunityStage;
        if (opportunityPrice) updateData.negotiated_price = parseFloat(opportunityPrice);
        if (opportunityNotes) updateData.notes = opportunityNotes;

        const { error: opportunityError } = await supabase
          .from('sales_funnel')
          .update(updateData)
          .eq('id', selectedOpportunity);

        if (opportunityError) {
          console.error('Error updating sales opportunity:', opportunityError);
          toast({
            title: "Cảnh báo",
            description: "Đã lưu lịch làm việc nhưng không thể cập nhật cơ hội bán hàng",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Thành công",
            description: "Đã cập nhật cơ hội bán hàng",
          });
        }
      }

      // Reset form
      resetForm();
      
      // Refresh data
      fetchContactHistory();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: editingContact ? "Không thể cập nhật lịch làm việc" : "Không thể thêm lịch làm việc",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedPersonnel("");
    setSelectedOpportunity("");
    setContactMethod("");
    setContactDate("");
    setSummary("");
    setDetails("");
    setOutcome("");
    setNextAction("");
    setOpportunityStage("");
    setOpportunityPrice("");
    setOpportunityNotes("");
    setSalesOpportunities([]);
    setEditingContact(null);
    setIsDialogOpen(false);
    if (isAdmin && user?.id) {
      setFormData({ assigned_sales_person_id: user.id });
    }
  };

  const handleEdit = (contact: ContactHistory) => {
    navigate(`/care-schedule/${contact.id}/edit`);
  };

  const isContactInFuture = (contactDate: string) => {
    return new Date(contactDate) > new Date();
  };

  const isContactWithin7Days = (contactDate: string) => {
    const contactDateTime = new Date(contactDate);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    return contactDateTime > now && contactDateTime <= sevenDaysFromNow;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users2 className="h-4 w-4" />;
      case 'social_media': return <MessageSquare className="h-4 w-4" />;
      case 'online_meeting': return <Video className="h-4 w-4" />;
      case 'direct_meeting': return <Handshake className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getContactMethodLabel = (method: string) => {
    switch (method) {
      case 'phone': return 'Gọi điện';
      case 'email': return 'Email';
      case 'meeting': return 'Gặp mặt';
      case 'social_media': return 'Nhắn OTT (MXH)';
      case 'online_meeting': return 'Họp online';
      case 'direct_meeting': return 'Họp trực tiếp';
      default: return 'Khác';
    }
  };

  const getContactDates = () => {
    return contactHistory.map(contact => new Date(contact.contact_date));
  };

  const isContactDate = (date: Date) => {
    return contactHistory.some(contact => {
      const contactDate = new Date(contact.contact_date);
      return contactDate.toDateString() === date.toDateString();
    });
  };

  const getContactCountForDate = (date: Date) => {
    return contactHistory.filter(contact => {
      const contactDate = new Date(contact.contact_date);
      return contactDate.toDateString() === date.toDateString();
    }).length;
  };

  const getContactsForDate = (date: Date) => {
    return contactHistory.filter(contact => {
      const contactDate = new Date(contact.contact_date);
      return contactDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.contact_date).getTime() - new Date(b.contact_date).getTime());
  };

  const handleDateClick = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (month: Date) => {
    setSelectedMonth(month);
    setSelectedDate(undefined); // Clear selected date when month changes
  };

  // Clear selected date when filter changes to show all data of the month
  useEffect(() => {
    setSelectedDate(undefined);
  }, [selectedSalesPerson, selectedMonth]);

  // Filter contacts based on selected date and month
  const getFilteredContacts = () => {
    if (!contactHistory) return [];
    
    console.log('Total contacts:', contactHistory.length);
    console.log('Selected month:', selectedMonth.toLocaleDateString('vi-VN'));
    console.log('Selected date:', selectedDate?.toLocaleDateString('vi-VN'));
    
    return contactHistory.filter(contact => {
      const contactDate = new Date(contact.contact_date);
      
      // If a specific date is selected, show only contacts for that date
      if (selectedDate) {
        const matches = contactDate.toDateString() === selectedDate.toDateString();
        console.log(`Contact ${contact.id} on ${contactDate.toLocaleDateString('vi-VN')} matches selected date:`, matches);
        return matches;
      }
      
      // Otherwise, show contacts for the selected month
      const matches = contactDate.getMonth() === selectedMonth.getMonth() && 
             contactDate.getFullYear() === selectedMonth.getFullYear();
      console.log(`Contact ${contact.id} on ${contactDate.toLocaleDateString('vi-VN')} matches selected month:`, matches);
      return matches;
    });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lịch Làm việc</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate("/care-schedule/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lịch làm việc
        </Button>
      </div>

      {/* Admin Sales Person Filter */}
      {isAdmin && (
        <div className="w-full sm:w-fit">
          <div className="space-y-2">
            <Label htmlFor="salesPersonFilter">Nhân viên kinh doanh</Label>
            <Select value={selectedSalesPerson} onValueChange={setSelectedSalesPerson}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Chọn nhân viên kinh doanh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {salesPersons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Layout with responsive design */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="w-full lg:w-fit lg:flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 justify-center">
                <Calendar className="h-5 w-5" />
                Lịch làm việc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateClick}
                  month={selectedMonth}
                  onMonthChange={handleMonthChange}
                  className="rounded-md border pointer-events-auto w-full"
                  modifiers={{
                    hasContact: getContactDates(),
                  }}
                  modifiersStyles={{
                    hasContact: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold',
                    },
                  }}
                  components={{
                    Day: ({ date, ...props }) => {
                      const contactCount = getContactCountForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <span>{date.getDate()}</span>
                          {contactCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {contactCount}
                            </span>
                          )}
                          {isToday && (
                            <div className="absolute -bottom-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      );
                    },
                  }}
                />
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span>Có lịch làm việc</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span>Hôm nay</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact History Section */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
        {getFilteredContacts().length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedDate 
                  ? `Không có lịch làm việc ngày ${selectedDate.toLocaleDateString('vi-VN')}`
                  : `Không có lịch làm việc tháng ${selectedMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`
                }
              </h3>
              <p className="text-muted-foreground mb-4 text-center">
                {contactHistory.length === 0 
                  ? "Bắt đầu bằng cách thêm lịch làm việc với khách hàng đầu tiên"
                  : "Chọn tháng hoặc ngày khác để xem lịch làm việc"
                }
              </p>
              <Button onClick={() => navigate("/care-schedule/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm lịch làm việc
              </Button>
            </CardContent>
          </Card>
        ) : (
          getFilteredContacts().map((contact) => {
            const isFuture = isContactInFuture(contact.contact_date);
            const isWithin7Days = isContactWithin7Days(contact.contact_date);
            
            let borderColorClass = "border-l-muted";
            let bgColorClass = "bg-background";
            
            if (isFuture) {
              if (isWithin7Days) {
                // Tương lai trong 7 ngày - màu đỏ
                borderColorClass = "border-l-red-500";
                bgColorClass = "bg-red-50";
              } else {
                // Tương lai xa hơn 7 ngày - màu xanh
                borderColorClass = "border-l-blue-500";
                bgColorClass = "bg-blue-50";
              }
            }
            
            return (
              <Card 
                key={contact.id} 
                className={`hover:shadow-md transition-shadow border-l-4 ${borderColorClass} ${bgColorClass}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={contact.key_personnel.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(contact.key_personnel.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold truncate">{contact.key_personnel.full_name}</h4>
                        {contact.key_personnel.position && (
                          <p className="text-sm text-muted-foreground truncate">{contact.key_personnel.position}</p>
                        )}
                        {contact.key_personnel.organizations && (
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.key_personnel.organizations.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="text-left sm:text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs sm:text-sm">
                            {new Date(contact.contact_date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isFuture && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Tương lai
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getContactMethodIcon(contact.contact_method)}
                          <span className="ml-1">{getContactMethodLabel(contact.contact_method)}</span>
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        className="self-start sm:self-auto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Sales Person Info */}
                  {contact.profiles && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Người tạo:</span>
                      <span>{contact.profiles.full_name}</span>
                    </div>
                  )}

                  {/* Participants */}
                  {contact.contact_history_participants && contact.contact_history_participants.length > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                      <Users2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Người tham gia:</span>
                      <div className="flex flex-wrap gap-1">
                        {contact.contact_history_participants.map((participant, index) => (
                          <span key={participant.sales_person_id} className="text-sm">
                            {participant.profiles.full_name}
                            {index < contact.contact_history_participants!.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="font-medium text-sm mb-1">Tóm tắt:</h5>
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
                      <p className="text-sm text-muted-foreground">{contact.outcome}</p>
                    </div>
                  )}
                  
                  {contact.next_action && (
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <h5 className="font-medium text-sm mb-1">Hành động tiếp theo:</h5>
                        <p className="text-sm text-muted-foreground">{contact.next_action}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareSchedule;