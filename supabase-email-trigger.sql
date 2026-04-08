-- ============================================================
-- DDPAI — Auto-send confirmation email on new booking
-- Uses pg_net extension to call Resend API directly from DB
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create function to send email via Resend
CREATE OR REPLACE FUNCTION send_booking_email()
RETURNS TRIGGER AS $$
DECLARE
  email_body TEXT;
  thai_date TEXT;
  month_names TEXT[] := ARRAY['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  day_names TEXT[] := ARRAY['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  d DATE;
  thai_year INT;
BEGIN
  -- Build Thai date string
  d := NEW.date::DATE;
  thai_year := EXTRACT(YEAR FROM d)::INT + 543;
  thai_date := 'วัน' || day_names[EXTRACT(DOW FROM d)::INT + 1] || 'ที่ ' ||
               EXTRACT(DAY FROM d)::INT || ' ' ||
               month_names[EXTRACT(MONTH FROM d)::INT] || ' ' || thai_year;

  -- Build HTML email
  email_body := '<div style="font-family:''Noto Sans Thai'',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">'
    || '<div style="text-align:center;padding:20px 0;border-bottom:2px solid #f97316">'
    || '<h1 style="color:#1e293b;margin:0;font-size:22px">DDPAI Installation</h1>'
    || '<p style="color:#94a3b8;margin:4px 0 0;font-size:13px">ระบบจองติดตั้งกล้องติดรถยนต์</p>'
    || '</div>'
    || '<div style="padding:24px 0">'
    || '<h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">สวัสดีคุณ ' || COALESCE(NEW.name, '') || '</h2>'
    || '<p style="color:#64748b;font-size:14px;margin:0 0 20px">การจองของคุณได้รับการบันทึกเรียบร้อยแล้ว กรุณารอการยืนยันจากทีมงาน</p>'
    || '<div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">'
    || '<div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">รหัสการจอง</div>'
    || '<div style="color:#fff;font-size:28px;font-weight:900;letter-spacing:4px;margin-top:6px">' || NEW.ref_code || '</div>'
    || '</div>'
    || '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">สาขา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">Susco Pinklao</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">วันที่</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || thai_date || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">เวลา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || NEW.time || ' น.</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รุ่นกล้อง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.camera_model, '') || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">ทะเบียนรถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.license_plate, '') || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.car_brand, '') || ' ' || COALESCE(NEW.car_model, '') || '</td></tr>'
    || '<tr><td style="padding:10px 0;color:#64748b">การติดตั้ง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.install_type, '') || '</td></tr>'
    || '</table>'
    || '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-top:20px;font-size:13px;color:#c2410c">'
    || '<strong>สถานะ:</strong> รอยืนยัน — คุณสามารถตรวจสอบสถานะการจองได้ที่หน้าเว็บ โดยใช้รหัสการจองด้านบน'
    || '</div></div>'
    || '<div style="text-align:center;padding:20px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">'
    || 'DDPAI Thailand — Powered by Susco Pinklao</div></div>';

  -- Send via Resend API using pg_net
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer re_9SEMaJK8_JnRNNFPwDzgj2hoozjzAcAGu'
      ),
      body := jsonb_build_object(
        'from', 'DDPAI Booking <onboarding@resend.dev>',
        'to', jsonb_build_array(NEW.email),
        'subject', 'DDPAI Booking Confirmation - ' || NEW.ref_code,
        'html', email_body
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_send_booking_email ON bookings;
CREATE TRIGGER trigger_send_booking_email
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_email();
