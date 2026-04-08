// Supabase Edge Function: send-booking-email
// Deploy: supabase functions deploy send-booking-email
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, name, refCode, date, time, branch, cameraModel, licensePlate, car, installType } = await req.json();

    if (!to || !refCode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlBody = `
      <div style="font-family:'Noto Sans Thai',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #f97316">
          <h1 style="color:#1e293b;margin:0;font-size:22px">DDPAI Installation</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">ระบบจองติดตั้งกล้องติดรถยนต์</p>
        </div>

        <div style="padding:24px 0">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">สวัสดีคุณ ${name}</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 20px">การจองของคุณได้รับการบันทึกเรียบร้อยแล้ว กรุณารอการยืนยันจากทีมงาน</p>

          <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
            <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">รหัสการจอง</div>
            <div style="color:#fff;font-size:28px;font-weight:900;letter-spacing:4px;margin-top:6px">${refCode}</div>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">สาขา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${branch}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">วันที่</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${date}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">เวลา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${time} น.</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รุ่นกล้อง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${cameraModel}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">ทะเบียนรถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${licensePlate}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${car}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b">การติดตั้ง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">${installType}</td></tr>
          </table>

          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-top:20px;font-size:13px;color:#c2410c">
            <strong>สถานะ:</strong> รอยืนยัน — คุณสามารถตรวจสอบสถานะการจองได้ที่หน้าเว็บ โดยใช้รหัสการจองด้านบน
          </div>
        </div>

        <div style="text-align:center;padding:20px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">
          DDPAI Thailand — Powered by Susco Pinklao
        </div>
      </div>
    `;

    // Send via Resend API
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DDPAI Booking <onboarding@resend.dev>",
          to: [to],
          subject: `DDPAI Booking Confirmation - ${refCode}`,
          html: htmlBody,
        }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "No email provider configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
