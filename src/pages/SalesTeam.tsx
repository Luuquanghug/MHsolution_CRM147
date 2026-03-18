import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { 
  Users, 
  Search, 
  UserCheck, 
  Mail,
  Shield,
  ShieldCheck,
  Edit,
  Plus,
  Trash2,
  Key,
  Phone
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SalesUser {
  id: string;
  email: string;
  full_name: string;
  user_roles: 'admin' | 'sales_person';
  created_at: string;
  phone?: string;
  position?: string;
  is_active: boolean;
  assigned_organizations_count?: number;
}

const SalesTeam = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin } = useRole();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SalesUser | null>(null);

  useEffect(() => {
    setPageInfo("Quản lý Nhân viên Kinh doanh", "Quản lý danh sách nhân viên và phân quyền hệ thống");
  }, [setPageInfo]);


  useEffect(() => {
    if (user && !authLoading) {
      fetchSalesUsers();
    }
  }, [user, authLoading]);

  const fetchSalesUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch organization counts for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: orgCounts, error: orgError } = await supabase
        .from('organizations')
        .select('assigned_sales_person_id')
        .in('assigned_sales_person_id', userIds);

      if (orgError) throw orgError;

      // Count organizations per user
      const orgCountMap = orgCounts?.reduce((acc, org) => {
        if (org.assigned_sales_person_id) {
          acc[org.assigned_sales_person_id] = (acc[org.assigned_sales_person_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Format users with org counts
      const formattedUsers: SalesUser[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        user_roles: profile.user_roles || 'sales_person',
        created_at: profile.created_at || '',
        phone: profile.phone || undefined,
        position: profile.position || undefined,
        is_active: profile.is_active ?? true,
        assigned_organizations_count: orgCountMap[profile.id] || 0,
      })) || [];

      setSalesUsers(formattedUsers);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân viên",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'sales_person') => {
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ Admin mới có thể thay đổi quyền",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_roles: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Cập nhật quyền thành công",
      });

      fetchSalesUsers();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ Admin mới có thể thay đổi trạng thái",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });

      fetchSalesUsers();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ Admin mới có thể xóa nhân viên",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Xóa nhân viên thành công",
      });

      fetchSalesUsers();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhân viên",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = salesUsers.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || !filterRole || user.user_roles === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Đang tải danh sách nhân viên...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nhân viên Kinh doanh</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Lọc theo quyền" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả quyền</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sales_person">Nhân viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isAdmin && (
          <Button onClick={() => navigate("/sales-team/new")} className="shrink-0 self-start px-3 sm:self-auto sm:px-4">
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhân viên kinh doanh
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Nhân viên</TableHead>
              <TableHead className="min-w-[150px] hidden sm:table-cell">Liên hệ</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Chức vụ</TableHead>
              <TableHead className="min-w-[100px]">Quyền</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Trạng thái</TableHead>
              <TableHead className="min-w-[80px] hidden xl:table-cell">Tổ chức phụ trách</TableHead>
              <TableHead className="min-w-[100px] hidden xl:table-cell">Ngày tham gia</TableHead>
              <TableHead className="text-right min-w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((salesUser) => (
              <TableRow key={salesUser.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      {salesUser.user_roles === 'admin' ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{salesUser.full_name}</div>
                      <div className="text-sm text-muted-foreground">{salesUser.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{salesUser.email}</span>
                    </div>
                    {salesUser.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{salesUser.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm">{salesUser.position || "Chưa có"}</span>
                </TableCell>
                <TableCell>
                  {isAdmin && salesUser.id !== user?.id ? (
                    <Select
                      value={salesUser.user_roles}
                      onValueChange={(newRole) => handleRoleChange(salesUser.id, newRole as 'admin' | 'sales_person')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sales_person">Nhân viên</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={salesUser.user_roles === 'admin' ? "default" : "secondary"}>
                      {salesUser.user_roles === 'admin' ? "Admin" : "Nhân viên"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {isAdmin && salesUser.id !== user?.id ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={salesUser.is_active}
                        onCheckedChange={(checked) => handleStatusChange(salesUser.id, checked)}
                      />
                      <span className="text-sm">
                        {salesUser.is_active ? "Hoạt động" : "Ngừng"}
                      </span>
                    </div>
                  ) : (
                    <Badge variant={salesUser.is_active ? "default" : "secondary"}>
                      {salesUser.is_active ? "Hoạt động" : "Ngừng"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm">{salesUser.assigned_organizations_count || 0}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm">{formatDate(salesUser.created_at)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end">
                    {(isAdmin || salesUser.id === user?.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(salesUser);
                          setPasswordDialogOpen(true);
                        }}
                        className="text-xs px-2"
                      >
                        <Key className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{salesUser.id === user?.id ? "Đổi mật khẩu" : "Reset"}</span>
                        <span className="sm:hidden">Reset</span>
                      </Button>
                    )}
                    
                    {isAdmin && salesUser.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(salesUser.id)}
                        className="text-destructive hover:text-destructive text-xs px-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Xóa</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterRole ? "Không tìm thấy nhân viên" : "Chưa có nhân viên nào"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || filterRole
              ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" 
              : "Nhân viên sẽ tự động xuất hiện khi họ đăng ký tài khoản"
            }
          </p>
        </div>
      )}

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        isOpen={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id}
        userEmail={selectedUser?.email}
        isCurrentUser={selectedUser?.id === user?.id}
      />
    </div>
  );
};

export default SalesTeam;