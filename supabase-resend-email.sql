-- ============================================================
-- DDPAI — Resend booking confirmation email RPC
-- Callable from JS via supabase.rpc('resend_booking_email', { p_booking_id })
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION resend_booking_email(p_booking_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  b bookings%ROWTYPE;
  email_body TEXT;
  thai_date TEXT;
  month_names TEXT[] := ARRAY['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  day_names TEXT[] := ARRAY['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  d DATE;
  thai_year INT;
  status_label TEXT;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF b.email IS NULL OR b.email = '' THEN RETURN FALSE; END IF;

  d := b.date::DATE;
  thai_year := EXTRACT(YEAR FROM d)::INT + 543;
  thai_date := 'วัน' || day_names[EXTRACT(DOW FROM d)::INT + 1] || 'ที่ ' ||
               EXTRACT(DAY FROM d)::INT || ' ' ||
               month_names[EXTRACT(MONTH FROM d)::INT] || ' ' || thai_year;

  status_label := CASE b.status
    WHEN 'confirmed' THEN 'ยืนยันแล้ว'
    WHEN 'completed' THEN 'เสร็จสิ้น'
    WHEN 'cancelled' THEN 'ยกเลิก'
    ELSE 'รอยืนยัน'
  END;

  email_body := '<div style="font-family:''Noto Sans Thai'',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">'
    || '<div style="text-align:center;padding:20px 0;border-bottom:2px solid #f97316">'
    || '<h1 style="color:#1e293b;margin:0;font-size:22px">DDPAI Installation</h1>'
    || '<p style="color:#94a3b8;margin:4px 0 0;font-size:13px">ระบบจองติดตั้งกล้องติดรถยนต์</p>'
    || '</div>'
    || '<div style="padding:24px 0">'
    || '<h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">สวัสดีคุณ ' || COALESCE(b.name,'') || '</h2>'
    || '<p style="color:#64748b;font-size:14px;margin:0 0 20px">นี่คือรายละเอียดการจองล่าสุดของคุณ — แอดมินได้ส่งอีเมลฉบับนี้ซ้ำ</p>'
    || '<div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">'
    || '<div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">รหัสการจอง</div>'
    || '<div style="color:#fff;font-size:28px;font-weight:900;letter-spacing:4px;margin-top:6px">' || b.ref_code || '</div>'
    || '</div>'
    || '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">สถานะ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || status_label || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">วันที่</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || thai_date || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">เวลา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || b.time || ' น.</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รุ่นกล้อง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(b.camera_model,'') || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">ทะเบียนรถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(b.license_plate,'') || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รถ</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(b.car_brand,'') || ' ' || COALESCE(b.car_model,'') || '</td></tr>'
    || '<tr><td style="padding:10px 0;color:#64748b">การติดตั้ง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(b.install_type,'') || '</td></tr>'
    || '</table>'
    || '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-top:20px;font-size:13px;color:#c2410c">'
    || '<strong>หมายเหตุ:</strong> หากต้องการเปลี่ยนแปลงโปรดติดต่อทีมงาน'
    || '</div></div>'
    || '<div style="text-align:center;padding:20px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">'
    || 'DDPAI Thailand — Powered by Susco Pinklao</div></div>';

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer re_9SEMaJK8_JnRNNFPwDzgj2hoozjzAcAGu'
    ),
    body := jsonb_build_object(
      'from', 'DDPAI Booking <onboarding@resend.dev>',
      'to', jsonb_build_array(b.email),
      'subject', 'DDPAI Booking - ' || b.ref_code,
      'html', email_body
    )
  );

  INSERT INTO booking_logs (booking_id, action, detail, created_at)
  VALUES (p_booking_id, 'email_resent', 'ส่งอีเมลซ้ำไปที่ ' || b.email, NOW());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resend_booking_email(BIGINT) TO authenticated, anon;
