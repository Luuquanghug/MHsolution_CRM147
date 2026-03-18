import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, User, Edit } from "lucide-react";

interface UpdateHistory {
  id: string;
  updated_at: string;
  updated_by: string;
  update_reason: string | null;
  old_stage: string | null;
  new_stage: string | null;
  old_negotiated_price: number | null;
  new_negotiated_price: number | null;
  old_assigned_sales_person_id: string | null;
  new_assigned_sales_person_id: string | null;
  old_notes: string | null;
  new_notes: string | null;
  old_expected_implementation_date: string | null;
  new_expected_implementation_date: string | null;
  old_expected_acceptance_date: string | null;
  new_expected_acceptance_date: string | null;
  updater_name: string;
  old_sales_person_name?: string;
  new_sales_person_name?: string;
}

interface SalesFunnelInfo {
  id: string;
  organization_name: string;
  product_name: string;
  current_stage: string;
  negotiated_price: number | null;
  assigned_sales_person_name: string | null;
  notes: string | null;
  expected_implementation_date: string | null;
  expected_acceptance_date: string | null;
  created_at: string;
  updated_at: string;
}

const SalesFunnelHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [history, setHistory] = useState<UpdateHistory[]>([]);
  const [funnelInfo, setFunnelInfo] = useState<SalesFunnelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState<{[key: string]: string}>({});


  useEffect(() => {
    if (user && id) {
      fetchHistory();
    }
  }, [user, id]);

  const fetchHistory = async () => {
    try {
      // Fetch stages mapping
      const { data: stagesData } = await supabase
        .from('sales_funnel_stages')
        .select('stage_key, stage_label');
      
      const stageMapping: {[key: string]: string} = {};
      stagesData?.forEach(stage => {
        stageMapping[stage.stage_key] = stage.stage_label;
      });
      setStages(stageMapping);

      // Fetch sales funnel info
      const { data: funnelData, error: funnelError } = await supabase
        .from('sales_funnel')
        .select(`
          id,
          stage,
          negotiated_price,
          notes,
          expected_implementation_date,
          expected_acceptance_date,
          created_at,
          updated_at,
          organizations(name),
          products(name),
          profiles(full_name)
        `)
        .eq('id', id)
        .single();

      if (funnelError) throw funnelError;

      setFunnelInfo({
        id: funnelData.id,
        organization_name: funnelData.organizations?.name || '',
        product_name: funnelData.products?.name || '',
        current_stage: stageMapping[funnelData.stage] || funnelData.stage,
        negotiated_price: funnelData.negotiated_price,
        assigned_sales_person_name: funnelData.profiles?.full_name || null,
        notes: funnelData.notes,
        expected_implementation_date: funnelData.expected_implementation_date,
        expected_acceptance_date: funnelData.expected_acceptance_date,
        created_at: funnelData.created_at,
        updated_at: funnelData.updated_at,
      });

      // Fetch update history
      const { data: historyData, error: historyError } = await supabase
        .from('sales_funnel_updates')
        .select(`
          *,
          profiles!sales_funnel_updates_updated_by_fkey(full_name)
        `)
        .eq('sales_funnel_id', id)
        .order('updated_at', { ascending: false });

      if (historyError) throw historyError;

      // Get sales person names for old and new assigned persons
      const historyWithNames = await Promise.all((historyData || []).map(async (update: any) => {
        let oldSalesPersonName = undefined;
        let newSalesPersonName = undefined;

        if (update.old_assigned_sales_person_id) {
          const { data: oldPerson } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', update.old_assigned_sales_person_id)
            .single();
          oldSalesPersonName = oldPerson?.full_name;
        }

        if (update.new_assigned_sales_person_id) {
          const { data: newPerson } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', update.new_assigned_sales_person_id)
            .single();
          newSalesPersonName = newPerson?.full_name;
        }

        return {
          ...update,
          updater_name: update.profiles?.full_name || 'Không xác định',
          old_sales_person_name: oldSalesPersonName,
          new_sales_person_name: newSalesPersonName,
        };
      }));

      setHistory(historyWithNames);
    } catch (error: any) {
      console.error('History fetch error:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lịch sử cập nhật",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return "Chưa xác định";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Không có";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderChange = (label: string, oldValue: any, newValue: any, formatter?: (val: any) => string) => {
    if (oldValue === newValue) return null;
    
    const formatValue = formatter || ((val: any) => val || "Không có");
    
    return (
      <div className="text-sm">
        <span className="font-medium">{label}:</span>
        <div className="ml-4">
          <span className="text-red-600">Cũ: {formatValue(oldValue)}</span>
          <span className="mx-2">→</span>
          <span className="text-green-600">Mới: {formatValue(newValue)}</span>
        </div>
      </div>
    );
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sales-funnel")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Lịch sử cập nhật cơ hội
            </h1>
            {funnelInfo && (
              <p className="text-muted-foreground mt-2">
                {funnelInfo.organization_name} - {funnelInfo.product_name}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => navigate(`/sales-funnel/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Cập nhật cơ hội
        </Button>
      </div>

      {funnelInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ hội hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Tổ chức:</span>
                  <p className="text-sm text-muted-foreground">{funnelInfo.organization_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Sản phẩm:</span>
                  <p className="text-sm text-muted-foreground">{funnelInfo.product_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Trạng thái hiện tại:</span>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {funnelInfo.current_stage}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Giá dự kiến:</span>
                  <p className="text-sm text-muted-foreground">{formatPrice(funnelInfo.negotiated_price)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Người phụ trách:</span>
                  <p className="text-sm text-muted-foreground">{funnelInfo.assigned_sales_person_name || "Chưa phân công"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Thời gian triển khai dự kiến:</span>
                  <p className="text-sm text-muted-foreground">{formatDateOnly(funnelInfo.expected_implementation_date)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Thời gian nghiệm thu dự kiến:</span>
                  <p className="text-sm text-muted-foreground">{formatDateOnly(funnelInfo.expected_acceptance_date)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Ngày tạo:</span>
                  <p className="text-sm text-muted-foreground">{formatDateOnly(funnelInfo.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Cập nhật cuối:</span>
                  <p className="text-sm text-muted-foreground">{formatDate(funnelInfo.updated_at)}</p>
                </div>
              </div>
            </div>
            
            {funnelInfo.notes && (
              <div className="mt-6 pt-4 border-t">
                <span className="text-sm font-medium">Thông tin chi tiết của cơ hội:</span>
                <p className="text-sm text-muted-foreground mt-1">{funnelInfo.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Lịch sử cập nhật ({history.length} lần)</h2>
        
        {history.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có lịch sử cập nhật nào</p>
            </CardContent>
          </Card>
        ) : (
          history.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{update.updater_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(update.updated_at)}
                  </div>
                </div>
                {update.update_reason && (
                  <p className="text-sm text-muted-foreground italic">
                    "{update.update_reason}"
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {renderChange(
                  "Trạng thái", 
                  stages[update.old_stage || ''] || update.old_stage, 
                  stages[update.new_stage || ''] || update.new_stage
                )}
                
                {renderChange(
                  "Giá dự kiến", 
                  update.old_negotiated_price, 
                  update.new_negotiated_price,
                  formatPrice
                )}
                
                {renderChange(
                  "Người phụ trách", 
                  update.old_sales_person_name, 
                  update.new_sales_person_name
                )}
                
                {renderChange(
                  "Thời gian triển khai dự kiến", 
                  update.old_expected_implementation_date, 
                  update.new_expected_implementation_date,
                  formatDateOnly
                )}
                
                {renderChange(
                  "Thời gian nghiệm thu dự kiến", 
                  update.old_expected_acceptance_date, 
                  update.new_expected_acceptance_date,
                  formatDateOnly
                )}
                
                {renderChange("Thông tin chi tiết của cơ hội", update.old_notes, update.new_notes)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesFunnelHistory;
