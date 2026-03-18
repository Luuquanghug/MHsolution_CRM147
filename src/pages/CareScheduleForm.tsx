import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";

// Data Interfaces
interface KeyPersonnel {
  id: string;
  full_name: string;
  position: string | null;
  organizations?: {
    id: string;
    name: string;
  } | null;
}

interface SalesOpportunity {
  id: string;
  stage: string;
  negotiated_price: number | null;
  notes: string | null;
  products?: {
    id: string;
    name: string;
  } | null;
}

interface SalesPerson {
  id: string;
  full_name: string;
  user_roles: string | null;
}

interface ContactHistory {
  id: string;
  personnel_id: string | null;
  contact_method: string;
  contact_date: string;
  summary: string;
  details: string | null;
  outcome: string | null;
  next_action: string | null;
  sales_opportunity_id: string | null;
  created_by: string | null;
}

export default function CareScheduleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRole();
  const { } = usePageContext();

  // State
  const [loading, setLoading] = useState(false);
  const [keyPersonnel, setKeyPersonnel] = useState<KeyPersonnel[]>([]);
  const [salesOpportunities, setSalesOpportunities] = useState<SalesOpportunity[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);

  // Form data
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactDate, setContactDate] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [outcome, setOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState("");
  const [opportunityStage, setOpportunityStage] = useState("");
  const [opportunityPrice, setOpportunityPrice] = useState("");
  const [opportunityNotes, setOpportunityNotes] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    assigned_sales_person_id: "",
  });

  // Fetch data
  const fetchKeyPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from("key_personnel")
        .select(`
          id,
          full_name,
          position,
          organizations (id, name)
        `)
        .order("full_name");

      if (error) throw error;
      setKeyPersonnel(data || []);
    } catch (error) {
      console.error("Error fetching key personnel:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân sự chủ chốt",
        variant: "destructive",
      });
    }
  };

  const fetchSalesPeople = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_roles")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setSalesPeople(data || []);
    } catch (error) {
      console.error("Error fetching sales people:", error);
    }
  };

  const fetchSalesOpportunities = async () => {
    if (!selectedPersonnel) return;

    try {
      const { data, error } = await supabase
        .from("sales_funnel")
        .select(`
          id,
          stage,
          negotiated_price,
          notes,
          products (id, name),
          organizations!inner (
            id,
            key_personnel!inner (
              id
            )
          )
        `)
        .eq("organizations.key_personnel.id", selectedPersonnel)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSalesOpportunities(data || []);
    } catch (error) {
      console.error("Error fetching sales opportunities:", error);
    }
  };

  // Load existing contact if editing
  const loadContactHistory = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("contact_history")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedPersonnel(data.personnel_id || "");
        setContactMethod(data.contact_method);
        setContactDate(new Date(data.contact_date).toISOString().slice(0, 16));
        setSummary(data.summary);
        setDetails(data.details || "");
        setOutcome(data.outcome || "");
        setNextAction(data.next_action || "");
        setSelectedOpportunity(data.sales_opportunity_id || "");

        // Load participants
        const { data: participantsData } = await supabase
          .from("contact_history_participants")
          .select("sales_person_id")
          .eq("contact_history_id", id);

        if (participantsData) {
          setSelectedParticipants(participantsData.map(p => p.sales_person_id));
        }

        if (data.sales_opportunity_id) {
          const { data: oppData } = await supabase
            .from("sales_funnel")
            .select("stage, negotiated_price, notes")
            .eq("id", data.sales_opportunity_id)
            .single();

          if (oppData) {
            setOpportunityStage(oppData.stage);
            setOpportunityPrice(oppData.negotiated_price?.toString() || "");
            setOpportunityNotes(oppData.notes || "");
          }
        }
      }
    } catch (error) {
      console.error("Error loading contact history:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin lịch làm việc",
          variant: "destructive",
        });
    }
  };

  // Effects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchKeyPersonnel();
      fetchSalesPeople();
      loadContactHistory();
      setFormData({ assigned_sales_person_id: user.id });
    }
  }, [user, authLoading, navigate, id]);

  useEffect(() => {
    fetchSalesOpportunities();
  }, [selectedPersonnel]);

  // Handlers
  const handlePersonnelChange = (personnelId: string) => {
    setSelectedPersonnel(personnelId);
    setSelectedOpportunity("");
    setOpportunityStage("");
    setOpportunityPrice("");
    setOpportunityNotes("");
  };

  const handleOpportunityChange = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    const opportunity = salesOpportunities.find(opp => opp.id === opportunityId);
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

    setLoading(true);
    
    try {
      const contactData = {
        personnel_id: selectedPersonnel,
        contact_method: contactMethod as any,
        contact_date: new Date(contactDate).toISOString(),
        summary,
        details: details || null,
        outcome: outcome || null,
        next_action: nextAction || null,
        sales_opportunity_id: selectedOpportunity || null,
        created_by: user?.id,
      };

      let contactHistoryId = id;

      if (id) {
        // Update existing contact
        const { error } = await supabase
          .from("contact_history")
          .update(contactData)
          .eq("id", id);

        if (error) throw error;

        // Remove existing participants
        const { error: deleteError } = await supabase
          .from("contact_history_participants")
          .delete()
          .eq("contact_history_id", id);

        if (deleteError) throw deleteError;
      } else {
        // Create new contact
        const { data: newContact, error } = await supabase
          .from("contact_history")
          .insert([contactData])
          .select()
          .single();

        if (error) throw error;
        contactHistoryId = newContact.id;
      }

      // Add participants
      if (selectedParticipants.length > 0 && contactHistoryId) {
        const participantData = selectedParticipants.map(participantId => ({
          contact_history_id: contactHistoryId,
          sales_person_id: participantId
        }));

        const { error: participantError } = await supabase
          .from("contact_history_participants")
          .insert(participantData);

        if (participantError) throw participantError;
      }

      // Update sales opportunity if selected
      if (selectedOpportunity && (opportunityStage || opportunityPrice || opportunityNotes)) {
        const updateData: any = {};
        if (opportunityStage) updateData.stage = opportunityStage;
        if (opportunityPrice) updateData.negotiated_price = parseFloat(opportunityPrice);
        if (opportunityNotes) updateData.notes = opportunityNotes;

        if (Object.keys(updateData).length > 0) {
          const { error: oppError } = await supabase
            .from("sales_funnel")
            .update(updateData)
            .eq("id", selectedOpportunity);

          if (oppError) throw oppError;
        }
      }

      toast({
        title: "Thành công",
        description: id ? "Cập nhật lịch làm việc thành công" : "Thêm lịch làm việc thành công",
      });

      navigate("/care-schedule");
    } catch (error) {
      console.error("Error saving contact history:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu lịch làm việc",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/care-schedule">Lịch Làm việc</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{id ? "Cập nhật" : "Thêm mới"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Button variant="outline" onClick={() => navigate("/care-schedule")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {id ? "Cập nhật lịch làm việc" : "Thêm lịch làm việc mới"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="personnel">Nhân sự chủ chốt *</Label>
                <SearchableSelect
                  options={keyPersonnel.map((person) => ({
                    value: person.id,
                    label: person.full_name,
                    description: person.organizations?.name,
                  }))}
                  value={selectedPersonnel}
                  onValueChange={handlePersonnelChange}
                  placeholder="Chọn nhân sự chủ chốt"
                  searchPlaceholder="Tìm kiếm nhân sự..."
                  emptyMessage="Không tìm thấy nhân sự nào."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Người tham gia *</Label>
                <SearchableSelect
                  options={salesPeople
                    .filter(person => selectedParticipants.includes(person.id) || !selectedParticipants.includes(person.id))
                    .map((person) => ({
                      value: person.id,
                      label: person.full_name,
                      description: person.user_roles === 'admin' ? 'Admin' : 'Nhân viên',
                    }))}
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedParticipants.includes(value)) {
                      setSelectedParticipants([...selectedParticipants, value]);
                    }
                  }}
                  placeholder="Thêm người tham gia"
                  searchPlaceholder="Tìm kiếm nhân viên..."
                  emptyMessage="Không tìm thấy nhân viên nào."
                />
                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedParticipants.map((participantId) => {
                      const participant = salesPeople.find(p => p.id === participantId);
                      return participant ? (
                        <div key={participantId} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                          <span>{participant.full_name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedParticipants(prev => prev.filter(id => id !== participantId))}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Phương thức *</Label>
                <Select value={contactMethod} onValueChange={setContactMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Gọi điện</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Gặp mặt</SelectItem>
                    <SelectItem value="social_media">Nhắn OTT (MXH)</SelectItem>
                    <SelectItem value="online_meeting">Họp online</SelectItem>
                    <SelectItem value="direct_meeting">Họp trực tiếp</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Ngày liên hệ *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary">Tóm tắt *</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tóm tắt ngắn gọn về cuộc liên hệ"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="details">Chi tiết</Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Mô tả chi tiết về nội dung cuộc liên hệ"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome">Kết quả</Label>
                  <Textarea
                    id="outcome"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Kết quả đạt được từ cuộc liên hệ"
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextAction">Hành động tiếp theo</Label>
                <Textarea
                  id="nextAction"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Kế hoạch cho lần liên hệ tiếp theo"
                  rows={3}
                />
              </div>
            </div>

            {/* Sales Opportunity Section */}
            {salesOpportunities.length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Chăm sóc theo cơ hội</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="opportunity">Chọn cơ hội bán hàng</Label>
                    <SearchableSelect
                      options={salesOpportunities.map((opportunity) => ({
                        value: opportunity.id,
                        label: `${opportunity.products?.name || 'Sản phẩm'} - ${opportunity.stage}`,
                      }))}
                      value={selectedOpportunity}
                      onValueChange={handleOpportunityChange}
                      placeholder="Chọn cơ hội bán hàng"
                      searchPlaceholder="Tìm kiếm cơ hội..."
                      emptyMessage="Không tìm thấy cơ hội nào."
                    />
                  </div>

                  {selectedOpportunity && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Thông tin cơ hội bán hàng</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="opportunityStage">Trạng thái</Label>
                          <Select value={opportunityStage} onValueChange={setOpportunityStage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prospect">Tiềm năng</SelectItem>
                              <SelectItem value="qualified">Đủ điều kiện</SelectItem>
                              <SelectItem value="proposal">Đề xuất</SelectItem>
                              <SelectItem value="negotiation">Đàm phán</SelectItem>
                              <SelectItem value="closed_won">Thành công</SelectItem>
                              <SelectItem value="closed_lost">Thất bại</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="opportunityPrice">Giá đàm phán</Label>
                          <Input
                            id="opportunityPrice"
                            type="number"
                            value={opportunityPrice}
                            onChange={(e) => setOpportunityPrice(e.target.value)}
                            placeholder="Nhập giá đàm phán"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="opportunityNotes">Ghi chú cơ hội</Label>
                        <Textarea
                          id="opportunityNotes"
                          value={opportunityNotes}
                          onChange={(e) => setOpportunityNotes(e.target.value)}
                          placeholder="Ghi chú về cơ hội bán hàng"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/care-schedule")}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Đang lưu..." : (id ? "Cập nhật" : "Lưu kế hoạch")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}