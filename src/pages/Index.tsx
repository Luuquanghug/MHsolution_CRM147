import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CONFIG } from "@/config/app";
import { 
  Building2, 
  Users, 
  Package, 
  Calendar, 
  UserCheck, 
  TrendingUp 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  organizations: number;
  keyPersonnel: number;
  products: number;
  careSchedule: number;
  collaborators: number;
  salesFunnel: number;
}

interface RecentUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'schedule' | 'opportunity';
  updateReason?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { setPageInfo } = usePageContext();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSchedules, setRecentSchedules] = useState<RecentUpdate[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<RecentUpdate[]>([]);

  useEffect(() => {
    setPageInfo("Tổng quan hệ thống", `Chào mừng bạn đến với hệ thống quản lý quan hệ khách hàng ${APP_CONFIG.name}`);
  }, [setPageInfo]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || roleLoading) return;
      
      try {
        setLoading(true);
        
        // Fetch organizations
        let orgQuery = supabase.from('organizations').select('id', { count: 'exact' });
        if (!isAdmin) {
          orgQuery = orgQuery.eq('assigned_sales_person_id', user.id);
        }
        const { count: organizationsCount } = await orgQuery;

        // Fetch key personnel
        let personnelQuery = supabase.from('key_personnel').select('id', { count: 'exact' });
        if (!isAdmin) {
          personnelQuery = personnelQuery.eq('assigned_sales_person_id', user.id);
        }
        const { count: keyPersonnelCount } = await personnelQuery;

        // Fetch total products (same for all users)
        const { count: productsCount } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('is_active', true);

        // Fetch future care schedule (contact_history with future dates)
        let careQuery = supabase
          .from('contact_history')
          .select('id', { count: 'exact' })
          .gte('contact_date', new Date().toISOString());
        if (!isAdmin) {
          careQuery = careQuery.eq('created_by', user.id);
        }
        const { count: careScheduleCount } = await careQuery;

        // Fetch sales funnel (excluding failed opportunities)
        let funnelQuery = supabase
          .from('sales_funnel')
          .select('id', { count: 'exact' })
          .eq('is_deleted', false)
          .neq('stage', 'closed_lost');
        if (!isAdmin) {
          funnelQuery = funnelQuery.eq('assigned_sales_person_id', user.id);
        }
        const { count: salesFunnelCount } = await funnelQuery;

        // Collaborators - set to 0 as requested
        const collaboratorsCount = 0;

        setStats({
          organizations: organizationsCount || 0,
          keyPersonnel: keyPersonnelCount || 0,
          products: productsCount || 0,
          careSchedule: careScheduleCount || 0,
          collaborators: collaboratorsCount,
          salesFunnel: salesFunnelCount || 0,
        });

        // Fetch recent schedule updates
        let scheduleQuery = supabase
          .from('contact_history')
          .select('id, summary, details, contact_date, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!isAdmin) {
          scheduleQuery = scheduleQuery.eq('created_by', user.id);
        }
        const { data: scheduleData } = await scheduleQuery;

        if (scheduleData) {
          const scheduleUpdates: RecentUpdate[] = scheduleData.map(item => ({
            id: item.id,
            title: item.summary,
            description: item.details || 'Không có mô tả',
            date: new Date(item.contact_date).toLocaleDateString('vi-VN'),
            type: 'schedule'
          }));
          setRecentSchedules(scheduleUpdates);
        }

        // Fetch recent opportunity updates
        let opportunityQuery = supabase
          .from('sales_funnel_updates')
          .select(`
            id, 
            old_stage, 
            new_stage, 
            update_reason, 
            created_at,
            sales_funnel:sales_funnel_id(
              organization:organization_id(name),
              product:product_id(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        const { data: opportunityData } = await opportunityQuery;

        if (opportunityData) {
          const opportunityUpdates: RecentUpdate[] = opportunityData.map(item => ({
            id: item.id,
            title: `${item.sales_funnel?.organization?.name || 'N/A'} - ${item.sales_funnel?.product?.name || 'N/A'}`,
            description: `${item.old_stage} → ${item.new_stage}`,
            date: new Date(item.created_at).toLocaleDateString('vi-VN'),
            type: 'opportunity',
            updateReason: item.update_reason || 'Không có lý do cụ thể'
          }));
          setRecentOpportunities(opportunityUpdates);
        }

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isAdmin, roleLoading]);

  const dashboardCards = [
    {
      title: "Khách hàng & Tổ chức",
      description: isAdmin ? "Tổng số tổ chức trong hệ thống" : "Số tổ chức được phân công cho bạn",
      icon: Building2,
      action: () => navigate("/organizations"),
      color: "text-blue-600",
      count: stats?.organizations
    },
    {
      title: "Nhân sự chủ chốt", 
      description: isAdmin ? "Tổng số nhân sự chủ chốt" : "Số nhân sự chủ chốt được phân công cho bạn",
      icon: Users,
      action: () => navigate("/key-personnel"),
      color: "text-green-600",
      count: stats?.keyPersonnel
    },
    {
      title: "Quản lý Sản phẩm",
      description: "Tổng số sản phẩm hiện có",
      icon: Package,
      action: () => navigate("/products"),
      color: "text-purple-600",
      count: stats?.products
    },
    {
      title: "Lịch Làm việc",
      description: isAdmin ? "Tổng số lịch làm việc trong tương lai" : "Số lịch làm việc trong tương lai của bạn",
      icon: Calendar,
      action: () => navigate("/care-schedule"),
      color: "text-orange-600",
      count: stats?.careSchedule
    },
    {
      title: "Cộng tác viên",
      description: "Số cộng tác viên bán hàng",
      icon: UserCheck,
      action: () => navigate("/collaborators"),
      color: "text-indigo-600",
      count: stats?.collaborators
    },
    {
      title: "Phễu Bán hàng",
      description: isAdmin ? "Tổng số cơ hội bán hàng" : "Số cơ hội bán hàng được phân công cho bạn",
      icon: TrendingUp,
      action: () => navigate("/sales-funnel"),
      color: "text-red-600",
      count: stats?.salesFunnel
    }
  ];

  if (loading || roleLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-lg mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-12" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dashboardCards.map((card, index) => (
          <Card 
            key={index}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 p-4"
            onClick={card.action}
          >
            <div className="text-center">
              <div className={`p-2 rounded-lg bg-muted ${card.color} w-fit mx-auto mb-2`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">
                {card.count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {card.title}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Updates - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schedule Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Cập nhật lịch gần nhất</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSchedules.length > 0 ? (
              <div className="space-y-3">
                {recentSchedules.map((update) => (
                  <div key={update.id} className="border-l-2 border-primary/20 pl-3 py-2">
                    <div className="font-medium text-sm">{update.title}</div>
                    <div className="text-xs text-muted-foreground mb-1">{update.description}</div>
                    <div className="text-xs text-muted-foreground">{update.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Chưa có cập nhật lịch nào
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Opportunity Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Cập nhật cơ hội gần nhất</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOpportunities.length > 0 ? (
              <div className="space-y-3">
                {recentOpportunities.map((update) => (
                  <div key={update.id} className="border-l-2 border-green-500/20 pl-3 py-2">
                    <div className="font-medium text-sm">{update.title}</div>
                    <div className="text-xs text-muted-foreground mb-1">{update.description}</div>
                    {update.updateReason && (
                      <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md mb-1">
                        Lý do: {update.updateReason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{update.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Chưa có cập nhật cơ hội nào
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
