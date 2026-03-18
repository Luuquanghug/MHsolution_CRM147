import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Categories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    setPageInfo("Danh mục Sản phẩm", "Quản lý các danh mục sản phẩm và dịch vụ");
  }, [setPageInfo]);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa danh mục thành công",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/")}>
                Trang chủ
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Danh mục Sản phẩm</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Button onClick={() => navigate("/categories/new")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex-1 min-w-0">{category.name}</CardTitle>
                <Badge variant={category.is_active ? "default" : "secondary"} className="shrink-0 text-[10px] sm:text-xs px-2 py-0.5">
                  {category.is_active ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/categories/${category.id}/edit`)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!categories?.length && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chưa có danh mục nào.</p>
          <Button
            className="mt-4"
            onClick={() => navigate("/categories/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục đầu tiên
          </Button>
        </div>
      )}
    </div>
  );
}