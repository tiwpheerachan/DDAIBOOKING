/**
 * ============================================================
 * DDPAI Admin Panel — Application Logic (Redesigned)
 * ============================================================
 */

let activeTab = "dashboard";
let selectedDate = todayThai();
let tsCalYear = nowThai().getFullYear();
let tsCalMonth = nowThai().getMonth();
let tsSelectedDate = todayThai();
let filterStatus = "all";
let holidayCalYear = nowThai().getFullYear();
let holidayCalMonth = nowThai().getMonth();
let bookingCalYear = nowThai().getFullYear();
let bookingCalMonth = nowThai().getMonth();
let bookingSelectedDate = todayThai();
let bookingSelectedId = null;
let schedCalYear = nowThai().getFullYear();
let schedCalMonth = nowThai().getMonth();
let schedSelectedDate = todayThai();
let schedViewSlot = null; // booking id for detail view

// SVG icon helper
const ICONS = {
  dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  schedule: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  bookings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
  timeslots: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  holidays: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
  settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  logs: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
};

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { key: "schedule", label: "ตารางงาน", icon: ICONS.schedule },
  { key: "bookings", label: "รายการจอง", icon: ICONS.bookings },
  { key: "timeslots", label: "จัดการเวลา", icon: ICONS.timeslots },
  { key: "holidays", label: "วันหยุด", icon: ICONS.holidays },
  { key: "logs", label: "ประวัติ", icon: ICONS.logs },
  { key: "settings", label: "ตั้งค่า", icon: ICONS.settings },
];

// ---- Tab Bar ----

function renderTabs() {
  const bar = document.getElementById("tabBar");
  bar.innerHTML = TABS.map(
    (t) =>
      `<button class="tab-btn ${activeTab === t.key ? "active" : ""}" onclick="switchTab('${t.key}')">${t.icon} <span class="tab-label">${t.label}</span></button>`
  ).join("");
}

function switchTab(key) {
  if (activeTab === "dashboard" && key !== "dashboard") _destroyAllCharts();
  activeTab = key;
  renderTabs();
  renderPage();
}

// ---- Main Page Render ----

function renderPage() {
  const page = document.getElementById("pageContent");
  const settings = getSettings();
  const bookings = getBookings();
  const blocked = getBlockedSlots();
  const allSlots = generateSlots(
    settings.openTime,
    settings.closeTime,
    settings.slotDuration,
    settings.breakStart,
    settings.breakEnd
  );
  const today = todayThai();

  // =============================================
  // DASHBOARD — Analytics
  // =============================================
  if (activeTab === "dashboard") {
    const todayBk = bookings.filter(b => b.date === today && b.status !== "cancelled");
    const ws = nowThai(); ws.setDate(ws.getDate() - ws.getDay());
    const weekStart = formatDate(ws);
    const weekBk = bookings.filter(b => b.date >= weekStart && b.status !== "cancelled");
    const pendingCount = bookings.filter(b => b.status === "pending").length;
    const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
    const completedCount = bookings.filter(b => b.status === "completed").length;
    const cancelledCount = bookings.filter(b => b.status === "cancelled").length;
    const activeTotal = bookings.filter(b => b.status !== "cancelled").length;
    const cancelRate = bookings.length > 0 ? Math.round((cancelledCount / bookings.length) * 100) : 0;

    // Last 30 days booking trend
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = nowThai(); d.setDate(d.getDate() - i);
      const ds = formatDate(d);
      last30.push({ date: ds, label: d.getDate() + "/" + (d.getMonth()+1), count: bookings.filter(b => b.date === ds && b.status !== "cancelled").length });
    }

    // Top camera models
    const camCount = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => { camCount[b.cameraModel] = (camCount[b.cameraModel]||0) + 1; });
    const topCams = Object.entries(camCount).sort((a,b) => b[1]-a[1]).slice(0, 6);

    // Channel distribution
    const chCount = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => { chCount[b.channel] = (chCount[b.channel]||0) + 1; });
    const topChannels = Object.entries(chCount).sort((a,b) => b[1]-a[1]);

    // Popular time slots
    const timeCount = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => { timeCount[b.time] = (timeCount[b.time]||0) + 1; });
    const topTimes = Object.entries(timeCount).sort((a,b) => b[1]-a[1]).slice(0, 5);

    // Frequent customers
    const custCount = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => {
      const key = b.phone || b.name;
      if (!custCount[key]) custCount[key] = { name: b.name, phone: b.phone, count: 0 };
      custCount[key].count++;
    });
    const topCustomers = Object.values(custCount).sort((a,b) => b.count - a.count).slice(0, 5);

    // Install type distribution
    const instCount = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => { instCount[b.installType] = (instCount[b.installType]||0) + 1; });
    const topInstall = Object.entries(instCount).sort((a,b) => b[1]-a[1]);

    page.innerHTML = `
      <div class="fade-in">
        <!-- KPI Cards -->
        <div class="stats-grid">
          <div class="stat-card stat-orange">
            <div class="stat-icon">${ICONS.schedule}</div>
            <div class="stat-body">
              <div class="stat-label">จองวันนี้</div>
              <div class="stat-value">${todayBk.length}</div>
              <div class="stat-sub">${thaiDate(today)}</div>
            </div>
          </div>
          <div class="stat-card stat-blue">
            <div class="stat-icon">${ICONS.bookings}</div>
            <div class="stat-body">
              <div class="stat-label">สัปดาห์นี้</div>
              <div class="stat-value">${weekBk.length}</div>
              <div class="stat-sub">รายการ</div>
            </div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon">${ICONS.dashboard}</div>
            <div class="stat-body">
              <div class="stat-label">ทั้งหมด (active)</div>
              <div class="stat-value">${activeTotal}</div>
              <div class="stat-sub">จากทั้งหมด ${bookings.length} รายการ</div>
            </div>
          </div>
          <div class="stat-card stat-yellow">
            <div class="stat-icon">${ICONS.timeslots}</div>
            <div class="stat-body">
              <div class="stat-label">รอยืนยัน</div>
              <div class="stat-value">${pendingCount}</div>
              <div class="stat-sub">ต้องดำเนินการ</div>
            </div>
          </div>
        </div>

        <!-- Charts Row 1: Trend + Status Pie -->
        <div class="dash-row">
          <div class="card dash-chart-wide">
            <div class="card-header"><h3>แนวโน้มการจอง 30 วัน</h3></div>
            <div class="chart-wrap" style="height:220px"><canvas id="chartTrend"></canvas></div>
          </div>
          <div class="card dash-chart-sm">
            <div class="card-header"><h3>สถานะการจอง</h3></div>
            <div class="chart-wrap" style="height:200px"><canvas id="chartStatus"></canvas></div>
            <div class="dash-status-list">
              <div><span class="dash-dot" style="background:#eab308"></span> รอยืนยัน ${pendingCount}</div>
              <div><span class="dash-dot" style="background:#22c55e"></span> ยืนยันแล้ว ${confirmedCount}</div>
              <div><span class="dash-dot" style="background:#3b82f6"></span> เสร็จสิ้น ${completedCount}</div>
              <div><span class="dash-dot" style="background:#ef4444"></span> ยกเลิก ${cancelledCount} (${cancelRate}%)</div>
            </div>
          </div>
        </div>

        <!-- Charts Row 2: Channel + Camera Model -->
        <div class="dash-row">
          <div class="card dash-chart-half">
            <div class="card-header"><h3>ช่องทางการซื้อ</h3></div>
            <div class="chart-wrap" style="height:200px"><canvas id="chartChannel"></canvas></div>
          </div>
          <div class="card dash-chart-half">
            <div class="card-header"><h3>รุ่นกล้องยอดนิยม</h3></div>
            <div class="chart-wrap" style="height:200px"><canvas id="chartCamera"></canvas></div>
          </div>
        </div>

        <!-- Row 3: Install Type + Popular Times + Top Customers -->
        <div class="dash-row dash-row-3">
          <div class="card">
            <div class="card-header"><h3>ประเภทการติดตั้ง</h3></div>
            <div class="chart-wrap" style="height:180px"><canvas id="chartInstall"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><h3>เวลายอดนิยม</h3></div>
            <div class="dash-rank-list">
              ${topTimes.length === 0 ? '<div class="empty-state"><p>ยังไม่มีข้อมูล</p></div>' : topTimes.map((t, i) => `
                <div class="dash-rank-item">
                  <div class="dash-rank-num">${i+1}</div>
                  <div class="dash-rank-label">${t[0]} น.</div>
                  <div class="dash-rank-bar"><div style="width:${topTimes[0][1] > 0 ? Math.round(t[1]/topTimes[0][1]*100) : 0}%;background:var(--orange-500)"></div></div>
                  <div class="dash-rank-val">${t[1]}</div>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>ลูกค้าที่ใช้บ่อย</h3></div>
            <div class="dash-rank-list">
              ${topCustomers.length === 0 ? '<div class="empty-state"><p>ยังไม่มีข้อมูล</p></div>' : topCustomers.map((c, i) => `
                <div class="dash-rank-item">
                  <div class="dash-rank-num">${i+1}</div>
                  <div class="dash-rank-label">
                    <div style="font-weight:600;color:var(--slate-800)">${c.name}</div>
                    <div style="font-size:11px;color:var(--slate-400)">${c.phone}</div>
                  </div>
                  <div class="dash-rank-val">${c.count} ครั้ง</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Today Schedule -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>ตารางวันนี้ — ${thaiDate(today)}</h3>
              <p>สถานะการจองในแต่ละช่วงเวลา</p>
            </div>
            <button class="btn btn-orange" onclick="openModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              จองให้ลูกค้า
            </button>
          </div>
          ${todayBk.length === 0
            ? '<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><p>ไม่มีการจองในวันนี้</p></div>'
            : todayBk.sort((a,b) => a.time.localeCompare(b.time)).map(b => renderScheduleRow(b)).join("")
          }
        </div>
      </div>
    `;

    // Render Charts after DOM is ready
    setTimeout(() => _renderDashCharts(last30, pendingCount, confirmedCount, completedCount, cancelledCount, topChannels, topCams, topInstall), 50);
  }

  // =============================================
  // SCHEDULE — Calendar + Timeline
  // =============================================
  else if (activeTab === "schedule") {
    const dayIsHoliday = isHoliday(schedSelectedDate);
    const dayBookings = bookings.filter(b => b.date === schedSelectedDate && b.status !== "cancelled");
    const dayBlocked = blocked.filter(s => s.date === schedSelectedDate);
    const bookedCount = dayBookings.length;
    const blockedCount = dayBlocked.length;
    const availCount = allSlots.length - bookedCount - blockedCount;
    const schedDetail = schedViewSlot ? bookings.find(b => b.id === schedViewSlot) : null;

    page.innerHTML = `
      <div class="sched-layout fade-in">
        <!-- Left Column -->
        <div class="sched-left">
          <!-- Mini Monthly Overview -->
          <div class="card">
            <div class="card-header" style="margin-bottom:10px">
              <h3>ภาพรวมรายเดือน</h3>
            </div>
            ${renderSchedCalendar(bookings, blocked, allSlots)}
          </div>

          <!-- Day Stats -->
          <div class="card sched-day-stats-card">
            <div class="sched-day-stats-title">${thaiDate(schedSelectedDate)}${dayIsHoliday ? ' <span class="badge badge-cancelled">วันหยุด</span>' : ''}</div>
            ${dayIsHoliday ? '' : `
            <div class="sched-day-stats">
              <div class="sched-stat">
                <div class="sched-stat-num" style="color:var(--orange-600)">${bookedCount}</div>
                <div class="sched-stat-label">จอง</div>
              </div>
              <div class="sched-stat">
                <div class="sched-stat-num" style="color:var(--green-600)">${availCount}</div>
                <div class="sched-stat-label">ว่าง</div>
              </div>
              <div class="sched-stat">
                <div class="sched-stat-num" style="color:var(--red-500)">${blockedCount}</div>
                <div class="sched-stat-label">ปิด</div>
              </div>
              <div class="sched-stat">
                <div class="sched-stat-num" style="color:var(--slate-600)">${allSlots.length}</div>
                <div class="sched-stat-label">ทั้งหมด</div>
              </div>
            </div>`}
          </div>

          <!-- Detail Panel (when a booking is selected) -->
          ${schedDetail ? `
          <div class="card sched-detail-card">
            <div class="sched-detail-close" onclick="schedViewSlot=null;renderPage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <div class="sched-detail-header">
              <span class="badge badge-${schedDetail.status}" style="font-size:12px;padding:4px 12px">${STATUS_MAP[schedDetail.status]?.label}</span>
              <div class="sched-detail-name">${schedDetail.name}</div>
              <div class="sched-detail-sub">${schedDetail.refCode || '#' + schedDetail.id} | ${schedDetail.time} น.</div>
            </div>
            <div class="sched-detail-rows">
              ${[
                ["รุ่นกล้อง", schedDetail.cameraModel],
                ["ทะเบียน", schedDetail.licensePlate],
                ["รถ", schedDetail.carBrand + " " + schedDetail.carModel],
                ["ประเภทรถ", schedDetail.carType],
                ["ติดตั้ง", schedDetail.installType],
                ["ช่องทาง", schedDetail.channel],
                ["คำสั่งซื้อ", schedDetail.orderNumber],
                ["เบอร์โทร", schedDetail.phone],
                ["อีเมล", schedDetail.email],
                ...(schedDetail.notes ? [["หมายเหตุ", schedDetail.notes]] : []),
              ].map(([k,v]) => `<div class="sched-detail-row"><span class="sched-dk">${k}</span><span class="sched-dv">${v}</span></div>`).join("")}
            </div>
            <div class="sched-detail-actions">
              ${schedDetail.status === 'pending' ? `<button class="btn btn-green btn-sm" onclick="changeStatus(${schedDetail.id},'confirmed')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> ยืนยัน</button>` : ''}
              ${schedDetail.status === 'confirmed' ? `<button class="btn btn-blue btn-sm" onclick="changeStatus(${schedDetail.id},'completed')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> เสร็จสิ้น</button>` : ''}
              ${schedDetail.status !== 'cancelled' && schedDetail.status !== 'completed' ? `<button class="btn btn-red btn-sm" onclick="changeStatus(${schedDetail.id},'cancelled')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> ยกเลิก</button>` : ''}
            </div>
          </div>` : ''}
        </div>

        <!-- Right Column: Daily Timeline -->
        <div class="sched-right">
          <div class="card">
            <div class="card-header">
              <div>
                <h3>ตารางรายวัน</h3>
                <p>${thaiDate(schedSelectedDate)}</p>
              </div>
              <button class="btn btn-orange btn-sm" onclick="openModal()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                จองให้ลูกค้า
              </button>
            </div>
            ${dayIsHoliday
              ? '<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red-500)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l6-6M9 9l6 6"/></svg><p>วันหยุด — ไม่เปิดให้บริการ</p></div>'
              : `<div class="sched-timeline">
              ${allSlots.map(slot => {
                const bk = bookings.find(b => b.date === schedSelectedDate && b.time === slot && b.status !== "cancelled");
                const isBlk = blocked.some(s => s.date === schedSelectedDate && s.time === slot);
                const isActive = bk && schedViewSlot === bk.id;
                if (bk) {
                  return `
                  <div class="tl-row tl-booked ${isActive ? 'tl-active' : ''}" onclick="schedViewSlot=${bk.id};renderPage()">
                    <div class="tl-time">${slot}</div>
                    <div class="tl-indicator"><div class="tl-dot tl-dot-${bk.status}"></div><div class="tl-line"></div></div>
                    <div class="tl-card tl-card-${bk.status}">
                      <div class="tl-card-top">
                        <span class="tl-card-name">${bk.name}</span>
                        <span class="badge badge-${bk.status}" style="font-size:10px;padding:2px 8px">${STATUS_MAP[bk.status]?.label}</span>
                      </div>
                      <div class="tl-card-detail">${bk.cameraModel} | ${bk.licensePlate} | ${bk.carBrand} ${bk.carModel}</div>
                      <div class="tl-card-detail">${bk.installType} | ${bk.phone}</div>
                    </div>
                  </div>`;
                } else if (isBlk) {
                  return `
                  <div class="tl-row tl-blocked">
                    <div class="tl-time">${slot}</div>
                    <div class="tl-indicator"><div class="tl-dot tl-dot-blocked"></div><div class="tl-line"></div></div>
                    <div class="tl-card tl-card-blocked">
                      <span class="tl-card-name" style="color:var(--red-500)">ปิดให้บริการ</span>
                    </div>
                  </div>`;
                } else {
                  return `
                  <div class="tl-row tl-free">
                    <div class="tl-time">${slot}</div>
                    <div class="tl-indicator"><div class="tl-dot tl-dot-free"></div><div class="tl-line"></div></div>
                    <div class="tl-card tl-card-free">
                      <span class="tl-empty-text">ว่าง</span>
                    </div>
                  </div>`;
                }
              }).join("")}
            </div>`}
          </div>
        </div>
      </div>
    `;
  }

  // =============================================
  // BOOKINGS — Calendar + Side Panel
  // =============================================
  else if (activeTab === "bookings") {
    const dayBookings = bookings.filter(b => b.date === bookingSelectedDate && b.status !== "cancelled");
    const selectedBooking = bookingSelectedId ? bookings.find(b => b.id === bookingSelectedId) : null;

    page.innerHTML = `
      <div class="bk-layout fade-in">
        <!-- Left: Calendar -->
        <div class="bk-calendar-panel">
          <div class="card">
            <div class="card-header">
              <div>
                <h3>ปฏิทินการจอง</h3>
                <p>ทั้งหมด ${bookings.filter(b => b.status !== "cancelled").length} รายการ</p>
              </div>
              <div class="filter-pills">
                ${["all", "pending", "confirmed", "completed", "cancelled"]
                  .map(
                    (s) =>
                      `<button class="pill ${filterStatus === s ? "active" : ""}" onclick="filterStatus='${s}';renderPage()">${
                        s === "all"
                          ? "ทั้งหมด"
                          : STATUS_MAP[s].label
                      } (${s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length})</button>`
                  )
                  .join("")}
              </div>
            </div>
            ${renderBookingCalendar(bookings)}
            <!-- Day Bookings List -->
            <div class="bk-day-header">
              <div class="bk-day-title">${thaiDate(bookingSelectedDate)}</div>
              <div class="bk-day-count">${dayBookings.length} รายการ</div>
            </div>
            <div class="bk-day-list">
              ${dayBookings.length === 0
                ? '<div class="bk-day-empty">ไม่มีการจองในวันนี้</div>'
                : dayBookings.sort((a,b) => a.time.localeCompare(b.time)).map(b => `
                  <div class="bk-item ${bookingSelectedId === b.id ? 'active' : ''} bk-item-${b.status}" onclick="bookingSelectedId=${b.id};renderPage()">
                    <div class="bk-item-time">${b.time}</div>
                    <div class="bk-item-body">
                      <div class="bk-item-name">${b.name}</div>
                      <div class="bk-item-detail">${b.cameraModel} | ${b.licensePlate}</div>
                    </div>
                    <span class="badge badge-${b.status}">${STATUS_MAP[b.status]?.label}</span>
                  </div>
                `).join("")}
            </div>
          </div>
        </div>

        <!-- Right: Detail Panel -->
        <div class="bk-detail-panel">
          ${selectedBooking ? renderBookingDetail(selectedBooking) : `
            <div class="card bk-detail-empty">
              <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" stroke-width="1.5" stroke-linecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <p>เลือกรายการจองจากปฏิทินเพื่อดูรายละเอียด</p>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // =============================================
  // TIMESLOTS — Calendar + Grid
  // =============================================
  else if (activeTab === "timeslots") {
    const dayIsHoliday = isHoliday(tsSelectedDate);
    const tsBookings = bookings.filter(b => b.date === tsSelectedDate && b.status !== "cancelled");
    const tsBlocked = blocked.filter(s => s.date === tsSelectedDate);
    const openCount = allSlots.length - tsBookings.length - tsBlocked.length;

    page.innerHTML = `
      <div class="ts-layout fade-in">
        <!-- Left: Calendar + Stats -->
        <div class="ts-left">
          <div class="card">
            <div class="card-header" style="margin-bottom:10px">
              <h3>เลือกวันที่</h3>
            </div>
            ${renderTsCalendar(bookings, blocked, allSlots)}
          </div>
          <div class="card ts-stats-card">
            <div class="ts-stats-title">${thaiDate(tsSelectedDate)}${dayIsHoliday ? ' <span class="badge badge-cancelled">วันหยุด</span>' : ''}</div>
            ${dayIsHoliday ? '<div style="font-size:12px;color:var(--slate-400);margin-top:4px">วันหยุด — ไม่เปิดให้บริการ</div>' : `
            <div class="ts-stats-row">
              <div class="ts-stat-pill ts-stat-open">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                เปิด ${openCount}
              </div>
              <div class="ts-stat-pill ts-stat-closed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                ปิด ${tsBlocked.length}
              </div>
              <div class="ts-stat-pill ts-stat-booked">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                จอง ${tsBookings.length}
              </div>
            </div>`}
          </div>
        </div>

        <!-- Right: Slot Grid -->
        <div class="ts-right">
          <div class="card">
            <div class="card-header">
              <div>
                <h3>จัดการช่วงเวลา</h3>
                <p>คลิกเพื่อสลับเปิด/ปิดช่วงเวลา</p>
              </div>
            </div>
            ${dayIsHoliday
              ? '<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red-500)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l6-6M9 9l6 6"/></svg><p>วันหยุด — ไปตั้งค่าที่แท็บ "วันหยุด"</p></div>'
              : `<div class="ts-grid">
              ${allSlots.map(slot => {
                const bk = bookings.find(b => b.date === tsSelectedDate && b.time === slot && b.status !== "cancelled");
                const isBlk = blocked.some(s => s.date === tsSelectedDate && s.time === slot);
                const cls = bk ? "ts-booked" : isBlk ? "ts-closed" : "ts-open";
                return `
                <div class="ts-slot ${cls}" ${bk ? "" : `onclick="toggleSlot('${tsSelectedDate}','${slot}')"`}>
                  <div class="ts-slot-icon">
                    ${bk
                      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>'
                      : isBlk
                        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
                        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>'
                    }
                  </div>
                  <div class="ts-slot-time">${slot}</div>
                  <div class="ts-slot-label">${bk ? bk.name : isBlk ? "ปิด" : "เปิด"}</div>
                </div>`;
              }).join("")}
            </div>`}
            <div class="ts-legend">
              <span class="ts-legend-item">
                <span class="ts-legend-swatch ts-open"></span> เปิดให้บริการ (คลิกเพื่อปิด)
              </span>
              <span class="ts-legend-item">
                <span class="ts-legend-swatch ts-closed"></span> ปิดให้บริการ (คลิกเพื่อเปิด)
              </span>
              <span class="ts-legend-item">
                <span class="ts-legend-swatch ts-booked"></span> มีการจอง (แก้ไขไม่ได้)
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =============================================
  // HOLIDAYS (Calendar year-ahead)
  // =============================================
  else if (activeTab === "holidays") {
    page.innerHTML = `
      <div class="fade-in">
        <div class="card">
          <div class="card-header">
            <div>
              <h3>จัดการวันหยุด</h3>
              <p>คลิกที่วันในปฏิทินเพื่อเปิด/ปิดวันหยุด — ลูกค้าจะไม่สามารถจองวันหยุดได้</p>
            </div>
          </div>
          <div class="holiday-year-nav">
            <button class="btn btn-ghost btn-sm" onclick="holidayCalYear--;renderPage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span class="holiday-year-label">${holidayCalYear + 543} (${holidayCalYear})</span>
            <button class="btn btn-ghost btn-sm" onclick="holidayCalYear++;renderPage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div class="holiday-months-grid">
            ${Array.from({ length: 12 }, (_, mi) => renderMiniMonth(holidayCalYear, mi)).join("")}
          </div>
        </div>
        ${renderHolidayList()}
      </div>
    `;
  }

  // =============================================
  // LOGS
  // =============================================
  else if (activeTab === "logs") {
    const allLogs = (_cache.logs || []).slice(0, 200);
    page.innerHTML = `
      <div class="card fade-in">
        <div class="card-header">
          <div>
            <h3>ประวัติการดำเนินการ</h3>
            <p>ล่าสุด ${allLogs.length} รายการ</p>
          </div>
        </div>
        ${allLogs.length === 0 ? '<div class="empty-state"><p>ยังไม่มีประวัติ</p></div>' : `
        <div class="log-list">
          ${allLogs.map(l => {
            const bk = bookings.find(b => b.id === l.booking_id);
            const timeStr = l.created_at ? new Date(l.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "";
            return `
            <div class="log-item">
              <div class="log-icon ${l.action === 'status_change' ? 'log-status' : l.action === 'restore' ? 'log-restore' : 'log-other'}">
                ${l.action === 'status_change' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                : l.action === 'restore' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 12a9 9 0 109-9"/><path d="M3 3v9h9"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'}
              </div>
              <div class="log-body">
                <div class="log-title">${bk ? bk.name + ' (' + (bk.refCode || '#' + bk.id) + ')' : 'Booking #' + l.booking_id}</div>
                <div class="log-detail">${l.detail || l.action}</div>
              </div>
              <div class="log-time">${timeStr}</div>
            </div>`;
          }).join("")}
        </div>`}
      </div>
    `;
  }

  // =============================================
  // SETTINGS
  // =============================================
  else if (activeTab === "settings") {
    const previewSlots = generateSlots(
      settings.openTime,
      settings.closeTime,
      settings.slotDuration,
      settings.breakStart,
      settings.breakEnd
    );

    page.innerHTML = `
      <div class="fade-in">
        <div class="card">
          <div class="card-header">
            <div>
              <h3>ตั้งค่าเวลาทำการ</h3>
              <p>กำหนดเวลาเปิด-ปิด ช่วงเวลา และเวลาพัก</p>
            </div>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label>เวลาเปิด</label>
              <input type="time" class="form-input" id="setOpen" value="${settings.openTime}">
            </div>
            <div class="form-group">
              <label>เวลาปิด</label>
              <input type="time" class="form-input" id="setClose" value="${settings.closeTime}">
            </div>
            <div class="form-group">
              <label>ช่วงเวลา (นาที)</label>
              <input type="number" class="form-input" id="setDuration" value="${settings.slotDuration}" min="10" max="120">
            </div>
            <div class="form-group">
              <label>พักเบรคเริ่ม</label>
              <input type="time" class="form-input" id="setBreakStart" value="${settings.breakStart}">
            </div>
            <div class="form-group">
              <label>พักเบรคจบ</label>
              <input type="time" class="form-input" id="setBreakEnd" value="${settings.breakEnd}">
            </div>
          </div>
          <div style="margin-top:20px;display:flex;gap:8px">
            <button class="btn btn-orange" onclick="saveTimeSettings()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
              บันทึกการตั้งค่า
            </button>
            <button class="btn btn-ghost" onclick="previewSlotsFn()">ดูตัวอย่าง</button>
          </div>
          <div id="slotPreview" style="margin-top:16px">
            <div style="font-size:13px;font-weight:600;color:var(--slate-600);margin-bottom:8px">ตัวอย่างเวลาที่สร้าง (${previewSlots.length} ช่วง):</div>
            <div class="slot-preview">${previewSlots.map((s) => `<span class="slot-chip">${s}</span>`).join("")}</div>
            <div style="font-size:12px;color:var(--slate-400);margin-top:8px">เวลาพักเบรค ${settings.breakStart} - ${settings.breakEnd} จะไม่แสดงให้ลูกค้า</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3>จัดการรุ่นกล้อง</h3>
              <p>เพิ่มหรือลบรุ่นกล้องที่มีให้บริการ</p>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <input class="form-input" id="newModelInput" placeholder="ชื่อรุ่นกล้องใหม่" style="flex:1">
            <button class="btn btn-green" onclick="addModel()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              เพิ่มรุ่น
            </button>
          </div>
          <div class="tag-list">
            ${settings.cameraModels
              .map(
                (m, i) => `
              <div class="tag">
                ${m}
                <button class="tag-remove" onclick="removeModel(${i})">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }
}

// ---- Schedule Calendar ----

function renderSchedCalendar(bookings, blocked, allSlots) {
  const firstDay = new Date(schedCalYear, schedCalMonth, 1).getDay();
  const daysInMonth = new Date(schedCalYear, schedCalMonth + 1, 0).getDate();
  const todayStr = todayThai();

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="scal-cell empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${schedCalYear}-${String(schedCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBk = bookings.filter(b => b.date === dateStr && b.status !== "cancelled");
    const dayBlk = blocked.filter(s => s.date === dateStr);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === schedSelectedDate;
    const isSunday = new Date(schedCalYear, schedCalMonth, d).getDay() === 0;
    const hol = isHoliday(dateStr);

    const total = allSlots.length;
    const usedCount = dayBk.length + dayBlk.length;
    // Fill percentage for visual bar
    const fillPct = total > 0 ? Math.round((dayBk.length / total) * 100) : 0;

    let cls = 'scal-cell';
    if (isSelected) cls += ' selected';
    if (isToday) cls += ' today';
    if (isSunday) cls += ' sunday';
    if (hol) cls += ' holiday';

    const barColor = dayBk.length === 0 ? 'var(--slate-200)' : fillPct >= 80 ? 'var(--red-500)' : fillPct >= 40 ? 'var(--orange-500)' : 'var(--green-500)';

    cells += `<div class="${cls}" onclick="schedSelectedDate='${dateStr}';schedViewSlot=null;renderPage()">
      <span class="scal-num">${d}</span>
      ${hol ? '<span class="scal-tag hol">หยุด</span>' : dayBk.length > 0 ? `<span class="scal-tag bk">${dayBk.length}</span>` : ''}
      ${!hol ? `<div class="scal-bar"><div class="scal-bar-fill" style="width:${fillPct}%;background:${barColor}"></div></div>` : ''}
    </div>`;
  }

  return `
    <div class="scal">
      <div class="scal-nav">
        <button class="cal-nav-btn" onclick="schedCalMonth--;if(schedCalMonth<0){schedCalMonth=11;schedCalYear--;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="scal-month-label">${thaiMonthFull(schedCalMonth)} ${schedCalYear + 543}</span>
        <button class="cal-nav-btn" onclick="schedCalMonth++;if(schedCalMonth>11){schedCalMonth=0;schedCalYear++;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="scal-header">
        <div class="scal-hd sun">อา</div><div class="scal-hd">จ</div><div class="scal-hd">อ</div>
        <div class="scal-hd">พ</div><div class="scal-hd">พฤ</div><div class="scal-hd">ศ</div><div class="scal-hd">ส</div>
      </div>
      <div class="scal-grid">${cells}</div>
      <div class="scal-legend">
        <span><span class="scal-legend-bar" style="background:var(--green-500)"></span> น้อย</span>
        <span><span class="scal-legend-bar" style="background:var(--orange-500)"></span> ปานกลาง</span>
        <span><span class="scal-legend-bar" style="background:var(--red-500)"></span> เกือบเต็ม</span>
      </div>
    </div>
  `;
}

// ---- Timeslot Calendar ----

function renderTsCalendar(bookings, blocked, allSlots) {
  const firstDay = new Date(tsCalYear, tsCalMonth, 1).getDay();
  const daysInMonth = new Date(tsCalYear, tsCalMonth + 1, 0).getDate();
  const todayStr = todayThai();
  const total = allSlots.length;

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="tscal-cell empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${tsCalYear}-${String(tsCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBk = bookings.filter(b => b.date === dateStr && b.status !== "cancelled").length;
    const dayBlk = blocked.filter(s => s.date === dateStr).length;
    const openSlots = total - dayBk - dayBlk;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === tsSelectedDate;
    const isSunday = new Date(tsCalYear, tsCalMonth, d).getDay() === 0;
    const hol = isHoliday(dateStr);

    let cls = 'tscal-cell';
    if (isSelected) cls += ' selected';
    if (isToday) cls += ' today';
    if (isSunday) cls += ' sunday';
    if (hol) cls += ' holiday';
    // Color by blocked ratio
    if (!hol && dayBlk > 0 && dayBlk >= total) cls += ' all-closed';
    else if (!hol && dayBlk > 0) cls += ' some-closed';

    cells += `<div class="${cls}" onclick="tsSelectedDate='${dateStr}';renderPage()">
      <span class="tscal-num">${d}</span>
      ${hol ? '' : dayBlk > 0 ? `<span class="tscal-tag closed">${dayBlk}</span>` : ''}
    </div>`;
  }

  return `
    <div class="tscal">
      <div class="scal-nav">
        <button class="cal-nav-btn" onclick="tsCalMonth--;if(tsCalMonth<0){tsCalMonth=11;tsCalYear--;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="scal-month-label">${thaiMonthFull(tsCalMonth)} ${tsCalYear + 543}</span>
        <button class="cal-nav-btn" onclick="tsCalMonth++;if(tsCalMonth>11){tsCalMonth=0;tsCalYear++;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="scal-header">
        <div class="scal-hd sun">อา</div><div class="scal-hd">จ</div><div class="scal-hd">อ</div>
        <div class="scal-hd">พ</div><div class="scal-hd">พฤ</div><div class="scal-hd">ศ</div><div class="scal-hd">ส</div>
      </div>
      <div class="scal-grid">${cells}</div>
    </div>
  `;
}

// ---- Booking Calendar ----

function renderBookingCalendar(bookings) {
  const firstDay = new Date(bookingCalYear, bookingCalMonth, 1).getDay();
  const daysInMonth = new Date(bookingCalYear, bookingCalMonth + 1, 0).getDate();
  const todayStr = todayThai();

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="bcal-cell empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${bookingCalYear}-${String(bookingCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== "cancelled");
    const filteredDay = filterStatus === "all"
      ? dayBookings
      : bookings.filter(b => b.date === dateStr && b.status === filterStatus);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === bookingSelectedDate;
    const isSunday = new Date(bookingCalYear, bookingCalMonth, d).getDay() === 0;
    const hol = isHoliday(dateStr);

    let cls = 'bcal-cell';
    if (isSelected) cls += ' selected';
    if (isToday) cls += ' today';
    if (isSunday) cls += ' sunday';
    if (hol) cls += ' holiday';

    // Dot indicators for booking status
    const hasPending = dayBookings.some(b => b.status === 'pending');
    const hasConfirmed = dayBookings.some(b => b.status === 'confirmed');
    const hasCompleted = dayBookings.some(b => b.status === 'completed');

    let dots = '';
    if (dayBookings.length > 0) {
      dots = '<div class="bcal-dots">';
      if (hasPending) dots += '<span class="bcal-dot pending"></span>';
      if (hasConfirmed) dots += '<span class="bcal-dot confirmed"></span>';
      if (hasCompleted) dots += '<span class="bcal-dot completed"></span>';
      dots += '</div>';
    }

    const count = filteredDay.length;

    cells += `<div class="${cls}" onclick="selectBookingDate('${dateStr}')">
      <span class="bcal-num">${d}</span>
      ${count > 0 ? `<span class="bcal-count">${count}</span>` : ''}
      ${dots}
    </div>`;
  }

  return `
    <div class="bcal">
      <div class="bcal-nav">
        <button class="cal-nav-btn" onclick="bookingCalMonth--;if(bookingCalMonth<0){bookingCalMonth=11;bookingCalYear--;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="bcal-month-label">${thaiMonthFull(bookingCalMonth)} ${bookingCalYear + 543}</span>
        <button class="cal-nav-btn" onclick="bookingCalMonth++;if(bookingCalMonth>11){bookingCalMonth=0;bookingCalYear++;}renderPage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="bcal-header">
        <div class="bcal-hd sun">อา</div><div class="bcal-hd">จ</div><div class="bcal-hd">อ</div>
        <div class="bcal-hd">พ</div><div class="bcal-hd">พฤ</div><div class="bcal-hd">ศ</div><div class="bcal-hd">ส</div>
      </div>
      <div class="bcal-grid">${cells}</div>
      <div class="bcal-legend">
        <span><span class="bcal-legend-dot pending"></span> รอยืนยัน</span>
        <span><span class="bcal-legend-dot confirmed"></span> ยืนยันแล้ว</span>
        <span><span class="bcal-legend-dot completed"></span> เสร็จสิ้น</span>
      </div>
    </div>
  `;
}

function selectBookingDate(dateStr) {
  bookingSelectedDate = dateStr;
  bookingSelectedId = null;
  renderPage();
}

function renderBookingDetail(b) {
  const rows = [
    ["รหัสการจอง", b.refCode || "-"],
    ["เวลา", b.time + " น."],
    ["วันที่", thaiDate(b.date)],
    ["ชื่อ-นามสกุล", b.name],
    ["เบอร์โทร", b.phone],
    ["อีเมล", b.email],
    ["รุ่นกล้อง", b.cameraModel],
    ["ทะเบียนรถ", b.licensePlate],
    ["ยี่ห้อ / รุ่น", b.carBrand + " " + b.carModel],
    ["ประเภทรถ", b.carType],
    ["การติดตั้ง", b.installType],
    ["ช่องทาง", b.channel],
    ["คำสั่งซื้อ", b.orderNumber],
  ];
  if (b.notes) rows.push(["หมายเหตุ", b.notes]);

  return `
    <div class="card bk-detail-card">
      <div class="bk-detail-top">
        <div>
          <div class="bk-detail-title">${b.name}</div>
          <div class="bk-detail-sub">${b.refCode || '#' + b.id} | ${b.time} น. | ${thaiDate(b.date)}</div>
        </div>
        <span class="badge badge-${b.status}" style="font-size:13px;padding:5px 14px">${STATUS_MAP[b.status]?.label}</span>
      </div>

      <div class="bk-detail-status-bar">
        <div class="bk-status-step ${b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed' ? 'active' : ''} ${b.status !== 'pending' ? 'done' : ''}">
          <div class="bk-status-circle">${b.status !== 'pending' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' : '1'}</div>
          <span>รอยืนยัน</span>
        </div>
        <div class="bk-status-line ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : ''}"></div>
        <div class="bk-status-step ${b.status === 'confirmed' || b.status === 'completed' ? 'active' : ''} ${b.status === 'completed' ? 'done' : ''}">
          <div class="bk-status-circle">${b.status === 'completed' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' : '2'}</div>
          <span>ยืนยันแล้ว</span>
        </div>
        <div class="bk-status-line ${b.status === 'completed' ? 'done' : ''}"></div>
        <div class="bk-status-step ${b.status === 'completed' ? 'active done' : ''}">
          <div class="bk-status-circle">3</div>
          <span>เสร็จสิ้น</span>
        </div>
      </div>

      <div class="bk-detail-rows">
        ${rows.map(([k, v]) => `
          <div class="bk-detail-row">
            <span class="bk-detail-key">${k}</span>
            <span class="bk-detail-val">${v}</span>
          </div>
        `).join("")}
      </div>

      <div class="bk-detail-actions">
        ${b.status === 'pending' ? `
          <button class="btn btn-green" onclick="changeStatus(${b.id},'confirmed')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            ยืนยันการจอง
          </button>` : ''}
        ${b.status === 'confirmed' ? `
          <button class="btn btn-blue" onclick="changeStatus(${b.id},'completed')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            เสร็จสิ้น
          </button>` : ''}
        ${b.status !== 'cancelled' && b.status !== 'completed' ? `
          <button class="btn btn-red" onclick="changeStatus(${b.id},'cancelled')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ยกเลิก
          </button>` : ''}
        ${b.status === 'cancelled' ? `
          <button class="btn btn-ghost" onclick="doRestore(${b.id},'pending')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 12a9 9 0 109-9"/><path d="M3 3v9h9"/></svg>
            กู้คืน (รอยืนยัน)
          </button>` : ''}
        ${b.status === 'completed' ? `
          <button class="btn btn-ghost" onclick="doRestore(${b.id},'confirmed')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 12a9 9 0 109-9"/><path d="M3 3v9h9"/></svg>
            ย้อนกลับ (ยืนยันแล้ว)
          </button>` : ''}
      </div>

      ${renderBookingLogs(b.id)}
    </div>
  `;
}

// ---- Mini Month Calendar for Holidays ----

function renderMiniMonth(year, month) {
  const holidays = getHolidays();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = todayThai();

  let cells = '';
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="mcal-cell empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hol = holidays.find(h => h.date === dateStr);
    const isToday = dateStr === todayStr;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isSunday = dayOfWeek === 0;
    let cls = 'mcal-cell';
    if (hol) cls += ' holiday';
    if (isToday) cls += ' today';
    if (isSunday) cls += ' sunday';
    cells += `<div class="${cls}" onclick="toggleHolidayDate('${dateStr}')" title="${dateStr}">${d}</div>`;
  }

  return `
    <div class="mini-month">
      <div class="mini-month-title">${thaiMonthFull(month)}</div>
      <div class="mcal-header">
        <div class="mcal-hd sun">อา</div><div class="mcal-hd">จ</div><div class="mcal-hd">อ</div>
        <div class="mcal-hd">พ</div><div class="mcal-hd">พฤ</div><div class="mcal-hd">ศ</div><div class="mcal-hd">ส</div>
      </div>
      <div class="mcal-grid">${cells}</div>
    </div>
  `;
}

function renderHolidayList() {
  const holidays = getHolidays().sort((a, b) => a.date.localeCompare(b.date));
  const filtered = holidays.filter(h => h.date.startsWith(String(holidayCalYear)));
  if (filtered.length === 0) return `
    <div class="card">
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" stroke-width="1.5" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
        <p>ยังไม่มีวันหยุดที่ตั้งค่าไว้ในปี ${holidayCalYear + 543}</p>
      </div>
    </div>`;
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <h3>รายการวันหยุดปี ${holidayCalYear + 543}</h3>
          <p>ทั้งหมด ${filtered.length} วัน</p>
        </div>
      </div>
      <div class="holiday-list">
        ${filtered.map(h => `
          <div class="holiday-item">
            <div class="holiday-date-badge">${new Date(h.date + 'T00:00:00').getDate()}</div>
            <div class="holiday-item-info">
              <div class="holiday-item-date">${thaiDate(h.date)}</div>
              ${h.label ? `<div class="holiday-item-label">${h.label}</div>` : ''}
            </div>
            <button class="btn btn-sm btn-red" onclick="toggleHolidayDate('${h.date}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ลบ
            </button>
          </div>
        `).join('')}
      </div>
    </div>`;
}

async function toggleHolidayDate(dateStr) {
  const existing = getHolidays().find(h => h.date === dateStr);
  if (existing) {
    await toggleHoliday(dateStr);
  } else {
    const label = prompt(`ตั้งชื่อวันหยุด ${thaiDate(dateStr)} (เว้นว่างได้):`, "");
    if (label === null) return;
    await toggleHoliday(dateStr, label);
  }
  renderPage();
}

// ---- Helper: Render Action Buttons ----

function renderActionBtns(b) {
  let html = '<div style="display:flex;gap:4px;margin-left:8px">';
  if (b.status === "pending")
    html += `<button class="btn btn-sm btn-green" onclick="changeStatus(${b.id},'confirmed')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      ยืนยัน</button>`;
  if (b.status === "confirmed")
    html += `<button class="btn btn-sm btn-blue" onclick="changeStatus(${b.id},'completed')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
      เสร็จสิ้น</button>`;
  if (b.status !== "cancelled" && b.status !== "completed")
    html += `<button class="btn btn-sm btn-red" onclick="changeStatus(${b.id},'cancelled')">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      ยกเลิก</button>`;
  html += "</div>";
  return html;
}

// ---- Dashboard Charts ----

const CHART_COLORS = ['#f97316','#3b82f6','#22c55e','#8b5cf6','#ec4899','#14b8a6','#eab308','#ef4444'];
const _charts = {};

function _destroyAllCharts() {
  Object.keys(_charts).forEach(k => { if (_charts[k]) { _charts[k].destroy(); _charts[k] = null; } });
}

function _renderDashCharts(trend, pending, confirmed, completed, cancelled, channels, cameras, installs) {
  _destroyAllCharts();

  const noAnim = { duration: 0 };
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: noAnim,
    transitions: { active: { animation: { duration: 0 } } },
    plugins: { legend: { display: false } }
  };

  // 1. Booking Trend
  const trendCtx = document.getElementById("chartTrend");
  if (trendCtx) _charts.trend = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: trend.map(t => t.label),
      datasets: [{ data: trend.map(t => t.count), borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.08)", fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: "#f97316", pointHoverRadius: 6, borderWidth: 2.5 }]
    },
    options: { ...baseOpts, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(0,0,0,0.04)" } }, x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } } } }
  });

  // 2. Status Doughnut
  const statusCtx = document.getElementById("chartStatus");
  if (statusCtx) _charts.status = new Chart(statusCtx, {
    type: "doughnut",
    data: {
      labels: ["รอยืนยัน","ยืนยันแล้ว","เสร็จสิ้น","ยกเลิก"],
      datasets: [{ data: [pending, confirmed, completed, cancelled], backgroundColor: ["#eab308","#22c55e","#3b82f6","#ef4444"], borderWidth: 3, borderColor: "#fff" }]
    },
    options: { ...baseOpts, cutout: "65%" }
  });

  // 3. Channel Bar
  const chCtx = document.getElementById("chartChannel");
  if (chCtx && channels.length > 0) _charts.channel = new Chart(chCtx, {
    type: "bar",
    data: {
      labels: channels.map(c => c[0] || "ไม่ระบุ"),
      datasets: [{ data: channels.map(c => c[1]), backgroundColor: CHART_COLORS.slice(0, channels.length), borderRadius: 6, borderSkipped: false, maxBarThickness: 32 }]
    },
    options: { ...baseOpts, indexAxis: "y", scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(0,0,0,0.04)" } }, y: { grid: { display: false } } } }
  });

  // 4. Camera Bar
  const camCtx = document.getElementById("chartCamera");
  if (camCtx && cameras.length > 0) _charts.camera = new Chart(camCtx, {
    type: "bar",
    data: {
      labels: cameras.map(c => (c[0] || "ไม่ระบุ").replace("DDPAI ", "")),
      datasets: [{ data: cameras.map(c => c[1]), backgroundColor: CHART_COLORS.slice(0, cameras.length), borderRadius: 6, borderSkipped: false, maxBarThickness: 36 }]
    },
    options: { ...baseOpts, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(0,0,0,0.04)" } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
  });

  // 5. Install Doughnut
  const instCtx = document.getElementById("chartInstall");
  if (instCtx && installs.length > 0) _charts.install = new Chart(instCtx, {
    type: "doughnut",
    data: {
      labels: installs.map(i => (i[0] || "ไม่ระบุ").replace(/^\d+\.\s*/, "")),
      datasets: [{ data: installs.map(i => i[1]), backgroundColor: CHART_COLORS.slice(0, installs.length), borderWidth: 3, borderColor: "#fff" }]
    },
    options: { ...baseOpts, cutout: "55%", plugins: { legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } } }
  });
}

function renderBookingLogs(bookingId) {
  const logs = getLogsForBooking(bookingId);
  if (logs.length === 0) return '';
  return `
    <div class="bk-logs" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(0,0,0,0.06)">
      <div style="font-size:12px;font-weight:700;color:var(--slate-500);margin-bottom:8px">ประวัติ</div>
      ${logs.slice(0, 10).map(l => `
        <div style="display:flex;gap:8px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(0,0,0,0.03)">
          <span style="color:var(--slate-400);min-width:120px">${l.created_at ? new Date(l.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : ""}</span>
          <span style="color:var(--slate-700)">${l.detail || l.action}</span>
        </div>
      `).join("")}
    </div>
  `;
}

async function doRestore(id, toStatus) {
  if (!confirm("ต้องการกู้คืนการจองนี้?")) return;
  await restoreBooking(id, toStatus);
  renderPage();
}

function renderScheduleRow(b) {
  return `
    <div class="schedule-row booked">
      <div class="schedule-time">${b.time}</div>
      <div class="schedule-info">
        <div class="name">${b.name}</div>
        <div class="detail">${b.cameraModel} | ${b.licensePlate} | ${b.carBrand} ${b.carModel} | ${b.installType}</div>
        <div class="detail">${b.channel} | ${b.orderNumber} | ${b.phone}</div>
      </div>
      <span class="badge badge-${b.status}">${STATUS_MAP[b.status]?.label || b.status}</span>
      ${renderActionBtns(b)}
    </div>
  `;
}

// ---- Actions ----

async function changeStatus(id, status) {
  await updateBookingStatus(id, status);
  renderPage();
}

async function toggleSlot(date, time) {
  await toggleBlockSlot(date, time);
  renderPage();
}

async function saveTimeSettings() {
  const s = getSettings();
  s.openTime = document.getElementById("setOpen").value;
  s.closeTime = document.getElementById("setClose").value;
  s.slotDuration =
    parseInt(document.getElementById("setDuration").value) || 30;
  s.breakStart = document.getElementById("setBreakStart").value;
  s.breakEnd = document.getElementById("setBreakEnd").value;
  await saveSettings(s);
  renderPage();
  alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
}

function previewSlotsFn() {
  const open = document.getElementById("setOpen").value;
  const close = document.getElementById("setClose").value;
  const dur =
    parseInt(document.getElementById("setDuration").value) || 30;
  const bs = document.getElementById("setBreakStart").value;
  const be = document.getElementById("setBreakEnd").value;
  const slots = generateSlots(open, close, dur, bs, be);
  document.getElementById("slotPreview").innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--slate-600);margin-bottom:8px">ตัวอย่างเวลาที่สร้าง (${slots.length} ช่วง):</div>
    <div class="slot-preview">${slots.map((s) => `<span class="slot-chip">${s}</span>`).join("")}</div>
    <div style="font-size:12px;color:var(--slate-400);margin-top:8px">เวลาพักเบรค ${bs} - ${be} จะไม่แสดงให้ลูกค้า</div>
  `;
}

async function addModel() {
  const input = document.getElementById("newModelInput");
  const name = input.value.trim();
  if (!name) return;
  const s = getSettings();
  s.cameraModels.push(name);
  await saveSettings(s);
  input.value = "";
  renderPage();
}

async function removeModel(idx) {
  const s = getSettings();
  s.cameraModels.splice(idx, 1);
  await saveSettings(s);
  renderPage();
}

// ---- Modal ----

function openModal() {
  const modal = document.getElementById("bookingModal");
  const settings = getSettings();
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-grid">
      <div class="form-group">
        <label>วันที่ *</label>
        <input type="date" class="form-input" id="mDate" onchange="updateModalTimes()">
      </div>
      <div class="form-group">
        <label>เวลา *</label>
        <select class="form-select" id="mTime">
          <option value="">-- เลือกวันที่ก่อน --</option>
        </select>
      </div>
      <div class="form-group">
        <label>หมายเลขคำสั่งซื้อ *</label>
        <input class="form-input" id="mOrder">
      </div>
      <div class="form-group">
        <label>ช่องทาง *</label>
        <select class="form-select" id="mChannel">
          <option value="">-- เลือก --</option>
          ${CHANNELS.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>รุ่นกล้อง *</label>
        <select class="form-select" id="mCamera">
          <option value="">-- เลือก --</option>
          ${settings.cameraModels.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>ทะเบียนรถ *</label>
        <input class="form-input" id="mPlate">
      </div>
      <div class="form-group">
        <label>ยี่ห้อรถ *</label>
        <input class="form-input" id="mBrand">
      </div>
      <div class="form-group">
        <label>รุ่นรถ *</label>
        <input class="form-input" id="mCarModel">
      </div>
      <div class="form-group">
        <label>ประเภทรถ *</label>
        <select class="form-select" id="mCarType">
          <option value="">-- เลือก --</option>
          ${CAR_TYPES.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>ประเภทการติดตั้ง *</label>
        <select class="form-select" id="mInstall">
          <option value="">-- เลือก --</option>
          ${INSTALL_TYPES.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>ชื่อ-นามสกุล *</label>
        <input class="form-input" id="mName">
      </div>
      <div class="form-group">
        <label>เบอร์โทร *</label>
        <input class="form-input" id="mPhone">
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label>อีเมล *</label>
        <input class="form-input" type="email" id="mEmail">
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label>หมายเหตุ</label>
        <textarea class="form-input" id="mNotes" rows="2" style="resize:vertical"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      <button class="btn btn-orange" onclick="submitModal()">ยืนยันการจอง</button>
    </div>
  `;
  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("bookingModal").classList.remove("show");
}

document.getElementById("bookingModal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function updateModalTimes() {
  const date = document.getElementById("mDate").value;
  const sel = document.getElementById("mTime");
  if (!date) {
    sel.innerHTML = '<option value="">-- เลือกวันที่ก่อน --</option>';
    return;
  }
  const avail = getAvailableSlots(date);
  sel.innerHTML =
    '<option value="">-- เลือกเวลา --</option>' +
    avail.map((s) => `<option value="${s}">${s}</option>`).join("");
}

async function submitModal() {
  const data = {
    branch: "pinklao",
    date: document.getElementById("mDate").value,
    time: document.getElementById("mTime").value,
    orderNumber: document.getElementById("mOrder").value,
    channel: document.getElementById("mChannel").value,
    cameraModel: document.getElementById("mCamera").value,
    licensePlate: document.getElementById("mPlate").value,
    carBrand: document.getElementById("mBrand").value,
    carModel: document.getElementById("mCarModel").value,
    carType: document.getElementById("mCarType").value,
    installType: document.getElementById("mInstall").value,
    name: document.getElementById("mName").value,
    phone: document.getElementById("mPhone").value,
    email: document.getElementById("mEmail").value,
    notes: document.getElementById("mNotes").value,
    status: "confirmed",
  };

  const required = [
    "date","time","orderNumber","channel","cameraModel",
    "licensePlate","carBrand","carModel","carType","installType",
    "name","phone","email",
  ];
  for (const key of required) {
    if (!data[key]) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง *");
      return;
    }
  }

  await addBooking(data);
  closeModal();
  renderPage();
}

// ---- Init: wait for Supabase data ----
renderTabs();
dataReady.then(() => renderPage());
