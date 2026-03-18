import { usePageContext } from "@/contexts/PageContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { APP_CONFIG } from "@/config/app";

export default function SystemConfiguration() {
  const { setPageInfo } = usePageContext();
  const { toast } = useToast();
  const [systemName, setSystemName] = useState<string>(APP_CONFIG.name);
  const [language, setLanguage] = useState<string>(APP_CONFIG.defaultLanguage);
  const [logoUrl, setLogoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPageInfo("Cấu hình hệ thống", "Quản lý cấu hình chung của hệ thống");
  }, [setPageInfo]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual save functionality
      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình hệ thống.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cấu hình hệ thống.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình chung</CardTitle>
          <CardDescription>
            Cấu hình các thông số cơ bản của hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Name */}
          <div className="space-y-2">
            <Label htmlFor="systemName">Tên hệ thống</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Nhập tên hệ thống"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Ngôn ngữ hệ thống</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn ngôn ngữ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* System Logo */}
          <div className="space-y-2">
            <Label>Logo hệ thống</Label>
            <ImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              label="Tải lên logo hệ thống"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}