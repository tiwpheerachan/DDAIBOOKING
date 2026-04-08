-- ============================================================
-- DDPAI — Booking Logs + Email on status change/edit
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create booking_logs table
CREATE TABLE IF NOT EXISTS booking_logs (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_logs_booking_id ON booking_logs (booking_id);

ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on booking_logs" ON booking_logs FOR ALL USING (true) WITH CHECK (true);

-- Add to realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE booking_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Email on status change (UPDATE trigger)
CREATE OR REPLACE FUNCTION send_booking_status_email()
RETURNS TRIGGER AS $$
DECLARE
  email_body TEXT;
  email_subject TEXT;
  status_thai TEXT;
  status_color TEXT;
  thai_date TEXT;
  month_names TEXT[] := ARRAY['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  day_names TEXT[] := ARRAY['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  d DATE;
BEGIN
  -- Only send if status actually changed
  IF OLD.status = NEW.status AND OLD.date = NEW.date AND OLD.time = NEW.time THEN
    RETURN NEW;
  END IF;

  -- Skip if no email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Thai date
  d := NEW.date::DATE;
  thai_date := 'วัน' || day_names[EXTRACT(DOW FROM d)::INT + 1] || 'ที่ ' ||
               EXTRACT(DAY FROM d)::INT || ' ' ||
               month_names[EXTRACT(MONTH FROM d)::INT] || ' ' || (EXTRACT(YEAR FROM d)::INT + 543);

  -- Status mapping
  CASE NEW.status
    WHEN 'confirmed' THEN status_thai := 'ยืนยันแล้ว'; status_color := '#16a34a';
    WHEN 'completed' THEN status_thai := 'เสร็จสิ้น'; status_color := '#2563eb';
    WHEN 'cancelled' THEN status_thai := 'ยกเลิก'; status_color := '#dc2626';
    ELSE status_thai := 'รอยืนยัน'; status_color := '#ca8a04';
  END CASE;

  -- Determine subject
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    email_subject := 'DDPAI Booking ' || CASE NEW.status
      WHEN 'confirmed' THEN 'Confirmed'
      WHEN 'completed' THEN 'Completed'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE 'Updated'
    END || ' - ' || NEW.ref_code;
  ELSE
    email_subject := 'DDPAI Booking Updated - ' || NEW.ref_code;
    status_thai := 'ข้อมูลถูกแก้ไข';
    status_color := '#f97316';
  END IF;

  email_body := '<div style="font-family:''Noto Sans Thai'',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">'
    || '<div style="text-align:center;padding:20px 0;border-bottom:2px solid #f97316">'
    || '<h1 style="color:#1e293b;margin:0;font-size:22px">DDPAI Installation</h1>'
    || '<p style="color:#94a3b8;margin:4px 0 0;font-size:13px">ระบบจองติดตั้งกล้องติดรถยนต์</p></div>'
    || '<div style="padding:24px 0">'
    || '<h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">สวัสดีคุณ ' || COALESCE(NEW.name, '') || '</h2>'
    || '<div style="background:' || status_color || ';color:#fff;display:inline-block;padding:8px 20px;border-radius:8px;font-weight:700;font-size:16px;margin:8px 0 16px">' || status_thai || '</div>'
    || '<div style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px">'
    || '<div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">รหัสการจอง</div>'
    || '<div style="color:#fff;font-size:24px;font-weight:900;letter-spacing:4px;margin-top:4px">' || NEW.ref_code || '</div></div>'
    || '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">วันที่</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || thai_date || '</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">เวลา</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || NEW.time || ' น.</td></tr>'
    || '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">รุ่นกล้อง</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.camera_model, '') || '</td></tr>'
    || '<tr><td style="padding:10px 0;color:#64748b">ทะเบียน</td><td style="padding:10px 0;text-align:right;font-weight:600;color:#1e293b">' || COALESCE(NEW.license_plate, '') || '</td></tr>'
    || '</table></div>'
    || '<div style="text-align:center;padding:20px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">DDPAI Thailand — Powered by Susco Pinklao</div></div>';

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer re_9SEMaJK8_JnRNNFPwDzgj2hoozjzAcAGu'
    ),
    body := jsonb_build_object(
      'from', 'DDPAI Booking <onboarding@resend.dev>',
      'to', jsonb_build_array(NEW.email),
      'subject', email_subject,
      'html', email_body
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create UPDATE trigger
DROP TRIGGER IF EXISTS trigger_send_booking_status_email ON bookings;
CREATE TRIGGER trigger_send_booking_status_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_status_email();
