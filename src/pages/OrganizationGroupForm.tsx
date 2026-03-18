import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function OrganizationGroupForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { setPageInfo } = usePageContext();
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    setPageInfo(
      isEditing ? "Chỉnh sửa Nhóm Khách hàng" : "Thêm Nhóm Khách hàng",
      isEditing ? "Chỉnh sửa thông tin nhóm khách hàng" : "Thêm nhóm khách hàng mới"
    );
  }, [setPageInfo, isEditing]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadGroup();
    }
  }, [id, isEditing]);

  const loadGroup = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_groups")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      form.reset({
        name: data.name,
        description: data.description || "",
        is_active: data.is_active,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
      navigate("/organization-groups");
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from("organization_groups")
          .update(data)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã cập nhật nhóm khách hàng thành công",
        });
      } else {
        const { error } = await supabase
          .from("organization_groups")
          .insert(data as any);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Đã thêm nhóm khách hàng thành công",
        });
      }

      navigate("/organization-groups");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/organization-groups")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa Nhóm Khách hàng" : "Thêm Nhóm Khách hàng"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Chỉnh sửa thông tin nhóm khách hàng" : "Thêm nhóm khách hàng mới"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhóm khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên nhóm *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên nhóm khách hàng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập mô tả nhóm khách hàng"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Trạng thái</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Nhóm có hoạt động không
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : isEditing ? "Cập nhật" : "Thêm mới"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/organization-groups")}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}