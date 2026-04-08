-- ============================================================
-- DDPAI Booking System — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  ref_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  branch TEXT NOT NULL DEFAULT 'pinklao',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  order_number TEXT,
  channel TEXT,
  camera_model TEXT,
  license_plate TEXT,
  car_brand TEXT,
  car_model TEXT,
  car_type TEXT,
  install_type TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_date ON bookings (date);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_ref_code ON bookings (ref_code);

-- 2. Blocked Slots Table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  UNIQUE (date, time)
);

CREATE INDEX idx_blocked_slots_date ON blocked_slots (date);

-- 3. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id BIGSERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  label TEXT DEFAULT ''
);

CREATE INDEX idx_holidays_date ON holidays (date);

-- 4. Settings Table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '16:30',
  slot_duration INTEGER NOT NULL DEFAULT 30,
  break_start TEXT NOT NULL DEFAULT '11:00',
  break_end TEXT NOT NULL DEFAULT '13:00',
  camera_models JSONB NOT NULL DEFAULT '["DDPAI Mini5","DDPAI Mini3","DDPAI Mola N3","DDPAI Mola N5","DDPAI Z50","DDPAI Z40","DDPAI X5 Pro"]',
  branches JSONB NOT NULL DEFAULT '[{"id":"pinklao","name":"Susco Pinklao","address":"ปิ่นเกล้า, กรุงเทพฯ"}]'
);

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. Row Level Security — Allow public access (anon)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on blocked_slots" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE blocked_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE holidays;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
