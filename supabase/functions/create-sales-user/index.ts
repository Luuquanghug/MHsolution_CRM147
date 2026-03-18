import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  full_name: string;
  phone?: string;
  position?: string;
  user_roles: "admin" | "sales_person";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const { email, full_name, phone, position, user_roles }: CreateUserRequest = await req.json();

    // Generate a random password
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError) {
      throw authError;
    }

    // Update the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        position,
        user_roles,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      throw profileError;
    }

    // Send email with login credentials if Resend is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: "MH Solution CRM <onboarding@resend.dev>",
        to: [email],
        subject: "Chào mừng bạn đến với MH Solution CRM",
        html: `
          <h1>Chào mừng ${full_name}!</h1>
          <p>Tài khoản CRM của bạn đã được tạo thành công.</p>
          <p><strong>Thông tin đăng nhập:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            <li>Mật khẩu: ${password}</li>
          </ul>
          <p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.</p>
          <p>Truy cập hệ thống tại: <a href="http://10.56.8.147:3000">http://10.56.8.147:3000</a></p>
          <p>Trân trọng,<br>Đội ngũ MH Solution</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Nhân viên đã được tạo thành công",
        user_id: authData.user.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Không thể tạo nhân viên mới"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);