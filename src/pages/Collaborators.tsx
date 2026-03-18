import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { 
  Users, 
  Search, 
  Mail,
  Edit,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Percent
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Collaborator {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  commission_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Collaborators = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRole();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageInfo("Quản lý Cộng tác viên", "Quản lý danh sách cộng tác viên và thông tin hoa hồng");
  }, [setPageInfo]);


  useEffect(() => {
    if (user && !authLoading) {
      fetchCollaborators();
    }
  }, [user, authLoading]);

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCollaborators(data || []);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách cộng tác viên",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (collaboratorId: string, newStatus: boolean) => {
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
        .from('collaborators')
        .update({ is_active: newStatus })
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });

      fetchCollaborators();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollaborator = async (collaboratorId: string) => {
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ Admin mới có thể xóa cộng tác viên",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa cộng tác viên này?")) return;

    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Xóa cộng tác viên thành công",
      });

      fetchCollaborators();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa cộng tác viên",
        variant: "destructive",
      });
    }
  };

  const filteredCollaborators = collaborators.filter(collaborator => {
    const matchesSearch = collaborator.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collaborator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collaborator.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collaborator.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCommissionRate = (rate?: number) => {
    if (!rate) return "Chưa có";
    return `${rate}%`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Đang tải danh sách cộng tác viên...
          </p>
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
              <BreadcrumbPage>Cộng tác viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Filters and Actions */}
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm cộng tác viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {isAdmin && (
          <Button onClick={() => navigate("/collaborators/new")} className="shrink-0 self-start px-3 sm:self-auto sm:px-4" size="sm">
            <Plus className="h-4 w-4" />
            Thêm cộng tác viên
          </Button>
        )}
      </div>

      {/* Collaborators Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thông tin cá nhân</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Tỷ lệ hoa hồng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollaborators.map((collaborator) => (
              <TableRow key={collaborator.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{collaborator.full_name}</div>
                      <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{collaborator.email}</span>
                    </div>
                    {collaborator.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{collaborator.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {collaborator.address ? (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{collaborator.address}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa có</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-3 w-3" />
                    <span>{formatCommissionRate(collaborator.commission_rate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={collaborator.is_active}
                        onCheckedChange={(checked) => handleStatusChange(collaborator.id, checked)}
                      />
                      <span className="text-sm">
                        {collaborator.is_active ? "Hoạt động" : "Ngừng"}
                      </span>
                    </div>
                  ) : (
                    <Badge variant={collaborator.is_active ? "default" : "secondary"}>
                      {collaborator.is_active ? "Hoạt động" : "Ngừng"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(collaborator.created_at)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/collaborators/${collaborator.id}/edit`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCollaborator(collaborator.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Xóa
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCollaborators.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "Không tìm thấy cộng tác viên" : "Chưa có cộng tác viên nào"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Thử thay đổi từ khóa tìm kiếm" 
              : "Thêm cộng tác viên mới để bắt đầu quản lý"
            }
          </p>
          {isAdmin && !searchTerm && (
            <Button className="mt-4" onClick={() => navigate("/collaborators/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm cộng tác viên đầu tiên
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Collaborators;