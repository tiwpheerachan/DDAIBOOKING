/**
 * ============================================================
 * DDPAI Booking System — Shared Data Layer (Supabase)
 * ============================================================
 * Data stored in Supabase + in-memory cache for fast reads
 * Realtime + polling fallback keeps all tabs in sync
 * ============================================================
 */

// ---- Supabase Config ----
const SUPABASE_URL = "https://gfrscpjttntsebavoayo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmcnNjcGp0dG50c2ViYXZvYXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mjk5MzIsImV4cCI6MjA5MTIwNTkzMn0.NM9KbQNBC-EnrkDOGwpy_eYm-ZZscL_QJewZ-ZNAX4Q";

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- In-Memory Cache ----
const _cache = {
  bookings: [],
  blockedSlots: [],
  holidays: [],
  logs: [],
  settings: null,
  loaded: false,
};

// ---- Constants ----
const DEFAULT_SETTINGS = {
  branches: [{ id: "pinklao", name: "Susco Pinklao", address: "ปิ่นเกล้า, กรุงเทพฯ" }],
  openTime: "09:00",
  closeTime: "16:30",
  slotDuration: 30,
  breakStart: "11:00",
  breakEnd: "13:00",
  cameraModels: ["DDPAI Mini5","DDPAI Mini3","DDPAI Mola N3","DDPAI Mola N5","DDPAI Z50","DDPAI Z40","DDPAI X5 Pro"],
};

const CHANNELS = ["Shopee", "Lazada", "TikTok", "NocNoc", "Shopify", "หน้าร้าน"];
const CAR_TYPES = ["รถญี่ปุ่น / ทั่วไป (Honda, Toyota ฯลฯ)", "รถยุโรป / รถ EV"];
const INSTALL_TYPES = ["1. หน้า","2. หน้า-หลัง / 4 ประตู","3. หน้า-หลัง / Hatchback","4. หน้า-หลัง / SUV","5. หน้า-หลัง / รถตู้"];

const STATUS_MAP = {
  confirmed: { bg: "#dcfce7", text: "#166534", label: "ยืนยันแล้ว" },
  pending: { bg: "#fef9c3", text: "#854d0e", label: "รอยืนยัน" },
  completed: { bg: "#dbeafe", text: "#1e40af", label: "เสร็จสิ้น" },
  cancelled: { bg: "#fee2e2", text: "#991b1b", label: "ยกเลิก" },
};

// ============================================================
// Utility Functions
// ============================================================

function generateSlots(openTime, closeTime, duration, breakStart, breakEnd) {
  const slots = [];
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  let cur = toMin(openTime);
  const end = toMin(closeTime);
  const bs = toMin(breakStart);
  const be = toMin(breakEnd);
  while (cur <= end) {
    if (cur < bs || cur >= be) {
      slots.push(String(Math.floor(cur / 60)).padStart(2, "0") + ":" + String(cur % 60).padStart(2, "0"));
    }
    cur += duration;
  }
  return slots;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get current date/time in Thailand timezone */
function nowThai() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
}

function todayThai() { return formatDate(nowThai()); }

/** Current time in minutes since midnight (Thailand) */
function nowMinutesThai() {
  const n = nowThai();
  return n.getHours() * 60 + n.getMinutes();
}

function thaiDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const days = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
  return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function thaiDayShort(dateStr) {
  return ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][new Date(dateStr + "T00:00:00").getDay()];
}

function thaiMonthFull(monthIndex) {
  return ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][monthIndex];
}

function generateRefCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return "DDPAI-" + code;
}

// ============================================================
// DB → Cache mapping
// ============================================================

function _rowToBooking(r) {
  return {
    id: r.id, refCode: r.ref_code, status: r.status, branch: r.branch,
    date: r.date, time: r.time, orderNumber: r.order_number, channel: r.channel,
    cameraModel: r.camera_model, licensePlate: r.license_plate,
    carBrand: r.car_brand, carModel: r.car_model, carType: r.car_type,
    installType: r.install_type, name: r.name, phone: r.phone,
    email: r.email, notes: r.notes, createdAt: r.created_at,
  };
}

function _rowToSettings(r) {
  return {
    branches: r.branches, openTime: r.open_time, closeTime: r.close_time,
    slotDuration: r.slot_duration, breakStart: r.break_start, breakEnd: r.break_end,
    cameraModels: r.camera_models,
  };
}

// ============================================================
// Synchronous reads from cache
// ============================================================

function getBookings() { return _cache.bookings; }
function getBlockedSlots() { return _cache.blockedSlots; }
function getHolidays() { return _cache.holidays; }
function getSettings() { return _cache.settings || { ...DEFAULT_SETTINGS }; }
function isHoliday(date) { return _cache.holidays.some(h => h.date === date); }

function getAvailableSlots(date, skipPastFilter) {
  if (isHoliday(date)) return [];
  const s = getSettings();
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const allSlots = generateSlots(s.openTime, s.closeTime, s.slotDuration, s.breakStart, s.breakEnd);
  const booked = _cache.bookings.filter(b => b.date === date && b.status !== "cancelled").map(b => b.time);
  const blocked = _cache.blockedSlots.filter(s => s.date === date).map(s => s.time);

  let available = allSlots.filter(s => !booked.includes(s) && !blocked.includes(s));

  // Filter past times for today (require 30 min advance, Thailand timezone)
  if (!skipPastFilter && date === todayThai()) {
    const cutoff = nowMinutesThai() + 30;
    available = available.filter(s => toMin(s) >= cutoff);
  }
  // Past dates = no slots
  if (!skipPastFilter && date < todayThai()) {
    return [];
  }

  return available;
}

function findBookingByRef(refCode) {
  return _cache.bookings.find(b => b.refCode === refCode) || null;
}

// ============================================================
// Mutations — write to Supabase then update cache
// ============================================================

async function addBooking(data) {
  let refCode = generateRefCode();
  const existing = _cache.bookings.map(b => b.refCode);
  while (existing.includes(refCode)) refCode = generateRefCode();

  const { data: rows, error } = await _sb.from("bookings").insert({
    ref_code: refCode, status: data.status || "pending", branch: data.branch,
    date: data.date, time: data.time, order_number: data.orderNumber,
    channel: data.channel, camera_model: data.cameraModel,
    license_plate: data.licensePlate, car_brand: data.carBrand,
    car_model: data.carModel, car_type: data.carType,
    install_type: data.installType, name: data.name,
    phone: data.phone, email: data.email, notes: data.notes,
  }).select();

  if (error) { console.error("addBooking:", error); return null; }
  const booking = _rowToBooking(rows[0]);
  _cache.bookings.push(booking);
  // Email is sent automatically by database trigger (pg_net + Resend)
  return booking;
}

async function updateBookingStatus(id, status, source) {
  const b = _cache.bookings.find(b => b.id === id);
  const oldStatus = b?.status;
  const { error } = await _sb.from("bookings").update({ status }).eq("id", id);
  if (error) { console.error("updateStatus:", error); return; }
  if (b) b.status = status;
  await addLog(id, "status_change", (source || "admin") + ": " + (STATUS_MAP[oldStatus]?.label || oldStatus) + " -> " + (STATUS_MAP[status]?.label || status));
}

async function cancelBookingByRef(refCode) {
  const b = _cache.bookings.find(b => b.refCode === refCode);
  if (!b || b.status === "cancelled" || b.status === "completed") return false;
  await updateBookingStatus(b.id, "cancelled", "customer");
  return true;
}

async function updateBookingByRef(refCode, updates) {
  const b = _cache.bookings.find(b => b.refCode === refCode);
  if (!b || b.status === "completed" || b.status === "cancelled") return false;

  const dbUpdates = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.cameraModel !== undefined) dbUpdates.camera_model = updates.cameraModel;
  if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate;
  if (updates.carBrand !== undefined) dbUpdates.car_brand = updates.carBrand;
  if (updates.carModel !== undefined) dbUpdates.car_model = updates.carModel;
  if (updates.carType !== undefined) dbUpdates.car_type = updates.carType;
  if (updates.installType !== undefined) dbUpdates.install_type = updates.installType;
  if (updates.orderNumber !== undefined) dbUpdates.order_number = updates.orderNumber;
  if (updates.channel !== undefined) dbUpdates.channel = updates.channel;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { error } = await _sb.from("bookings").update(dbUpdates).eq("id", b.id);
  if (error) { console.error("updateBooking:", error); return false; }

  // Update local cache
  Object.keys(updates).forEach(k => { b[k] = updates[k]; });
  return true;
}

async function deleteBooking(id) {
  await _sb.from("bookings").delete().eq("id", id);
  _cache.bookings = _cache.bookings.filter(b => b.id !== id);
}

// ---- Activity Logs ----

async function addLog(bookingId, action, detail) {
  const { data: rows } = await _sb.from("booking_logs").insert({
    booking_id: bookingId, action, detail: detail || "",
    created_at: new Date().toISOString(),
  }).select();
  if (rows?.[0]) _cache.logs.push(rows[0]);
}

function getLogsForBooking(bookingId) {
  return _cache.logs.filter(l => l.booking_id === bookingId).sort((a, b) => b.id - a.id);
}

async function restoreBooking(id, toStatus) {
  const { error } = await _sb.from("bookings").update({ status: toStatus }).eq("id", id);
  if (error) { console.error("restoreBooking:", error); return false; }
  const b = _cache.bookings.find(b => b.id === id);
  if (b) b.status = toStatus;
  await addLog(id, "restore", "กู้คืนเป็น " + (STATUS_MAP[toStatus]?.label || toStatus));
  return true;
}

async function saveSettings(s) {
  const { error } = await _sb.from("settings").update({
    open_time: s.openTime, close_time: s.closeTime, slot_duration: s.slotDuration,
    break_start: s.breakStart, break_end: s.breakEnd,
    camera_models: s.cameraModels, branches: s.branches,
  }).eq("id", 1);
  if (error) console.error("saveSettings:", error);
  _cache.settings = s;
}

async function toggleBlockSlot(date, time) {
  const idx = _cache.blockedSlots.findIndex(s => s.date === date && s.time === time);
  if (idx >= 0) {
    await _sb.from("blocked_slots").delete().eq("date", date).eq("time", time);
    _cache.blockedSlots.splice(idx, 1);
  } else {
    const { data: rows } = await _sb.from("blocked_slots").insert({ date, time }).select();
    if (rows?.[0]) _cache.blockedSlots.push({ id: rows[0].id, date, time });
  }
}

async function toggleHoliday(date, label) {
  const idx = _cache.holidays.findIndex(h => h.date === date);
  if (idx >= 0) {
    await _sb.from("holidays").delete().eq("date", date);
    _cache.holidays.splice(idx, 1);
  } else {
    const { data: rows } = await _sb.from("holidays").insert({ date, label: label || "" }).select();
    if (rows?.[0]) _cache.holidays.push({ id: rows[0].id, date, label: label || "" });
  }
}

// ============================================================
// Load + Realtime + Polling
// ============================================================

/** Fetch all data from Supabase into cache */
async function _refreshAll() {
  try {
    const [bkRes, blRes, holRes, setRes, logRes] = await Promise.all([
      _sb.from("bookings").select("*").order("id"),
      _sb.from("blocked_slots").select("*"),
      _sb.from("holidays").select("*"),
      _sb.from("settings").select("*").eq("id", 1).single(),
      _sb.from("booking_logs").select("*").order("id", { ascending: false }).limit(500),
    ]);

    if (bkRes.error) console.error("Load bookings:", bkRes.error);
    if (blRes.error) console.error("Load blocked:", blRes.error);

    _cache.bookings = (bkRes.data || []).map(_rowToBooking);
    _cache.blockedSlots = (blRes.data || []).map(r => ({ id: r.id, date: r.date, time: r.time }));
    _cache.holidays = (holRes.data || []).map(r => ({ id: r.id, date: r.date, label: r.label }));
    _cache.settings = setRes.data ? _rowToSettings(setRes.data) : { ...DEFAULT_SETTINGS };
    _cache.logs = logRes.data || [];
    _cache.loaded = true;

    console.log("Data loaded:", _cache.bookings.length, "bookings,", _cache.logs.length, "logs");
  } catch (e) {
    console.error("_refreshAll failed:", e);
  }
}

/** Trigger re-render on whichever page is active */
function _triggerRender() {
  try {
    if (typeof renderPage === "function") renderPage();
    else if (typeof render === "function") render();
  } catch (e) {
    console.error("Render error:", e);
  }
}

/** Setup Supabase Realtime subscription */
function _setupRealtime() {
  _sb.channel("ddpai-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
      _refreshAll().then(_triggerRender);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "blocked_slots" }, () => {
      _refreshAll().then(_triggerRender);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "holidays" }, () => {
      _refreshAll().then(_triggerRender);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
      _refreshAll().then(_triggerRender);
    })
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });
}

/** Polling fallback: refresh every 15 seconds in case Realtime fails */
let _lastBookingCount = 0;
function _startPolling() {
  setInterval(async () => {
    const prev = _cache.bookings.length;
    await _refreshAll();
    if (_cache.bookings.length !== prev || _cache.bookings.length !== _lastBookingCount) {
      _lastBookingCount = _cache.bookings.length;
      _triggerRender();
    }
  }, 15000);
}

/** Also refresh when tab becomes visible again */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && _cache.loaded) {
    _refreshAll().then(_triggerRender);
  }
});

// ---- Global init promise ----
const dataReady = _refreshAll().then(() => {
  _setupRealtime();
  _startPolling();
});
