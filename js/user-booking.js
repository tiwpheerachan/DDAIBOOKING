/**
 * ============================================================
 * DDPAI User Booking — Application Logic (Redesigned)
 * ============================================================
 */

let currentStep = 1;
let submitted = false;
let lastBooking = null; // stores the returned booking after submit
let checkMode = false;
let checkedBooking = null;
let editMode = false; // toggle edit form
let editCalYear, editCalMonth;
let calYear, calMonth;

// Initialize calendar to next available month
(function initCal() {
  const tomorrow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  tomorrow.setDate(tomorrow.getDate() + 1);
  calYear = tomorrow.getFullYear();
  calMonth = tomorrow.getMonth();
})();

const form = {
  branch: "pinklao",
  date: "",
  time: "",
  orderNumber: "",
  channel: "",
  cameraModel: "",
  licensePlate: "",
  carBrand: "",
  carModel: "",
  carType: "",
  installType: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

// SVG Icons
const IC = {
  calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  car: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a1 1 0 00-.98.75L3 11H2v5h1"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
  user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  chevL: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chevR: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>',
  arrowL: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  arrowR: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  bigCheck: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
};

// ---- Helpers ----

function canGoNext() {
  if (currentStep === 1) return form.date && form.time;
  if (currentStep === 2)
    return (
      form.orderNumber &&
      form.channel &&
      form.cameraModel &&
      form.licensePlate &&
      form.carBrand &&
      form.carModel &&
      form.carType &&
      form.installType
    );
  if (currentStep === 3) return form.name && form.phone && form.email;
  return true;
}

// ---- Calendar Builder ----

function buildCalendar() {
  const today = nowThai();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Nav buttons disabled logic
  const canPrev = new Date(calYear, calMonth, 1) > tomorrow;
  const canNext = new Date(calYear, calMonth + 1, 1) <= maxDate;

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(calYear, calMonth, d);
    const dateStr = formatDate(dateObj);
    const isPast = dateObj < today;
    const isTooFar = dateObj > maxDate;
    const holiday = isHoliday(dateStr);
    const avail = (!isPast && !isTooFar && !holiday) ? getAvailableSlots(dateStr) : [];
    const isSelected = form.date === dateStr;
    const isSunday = dateObj.getDay() === 0;
    const isToday = formatDate(today) === dateStr;

    let cls = 'cal-cell';
    if (isPast || isTooFar) cls += ' past';
    else if (holiday) cls += ' holiday';
    else if (avail.length === 0) cls += ' full';
    else cls += ' available';
    if (isSelected) cls += ' selected';
    if (isSunday) cls += ' sunday';
    if (isToday) cls += ' is-today';

    const canClick = !isPast && !isTooFar && !holiday && avail.length > 0;
    const availText = holiday ? 'หยุด' : (isPast || isTooFar) ? '' : avail.length > 0 ? avail.length : 'เต็ม';

    cells += `<div class="${cls}" ${canClick ? `onclick="selectDate('${dateStr}')"` : ''}>
      <span class="cal-num">${d}</span>
      ${availText !== '' ? `<span class="cal-avail">${availText}</span>` : ''}
    </div>`;
  }

  return `
    <div class="user-calendar">
      <div class="cal-nav">
        <button class="cal-nav-btn" ${canPrev ? '' : 'disabled'} onclick="calMonth--;if(calMonth<0){calMonth=11;calYear--;}render();">${IC.chevL}</button>
        <span class="cal-month-label">${thaiMonthFull(calMonth)} ${calYear + 543}</span>
        <button class="cal-nav-btn" ${canNext ? '' : 'disabled'} onclick="calMonth++;if(calMonth>11){calMonth=0;calYear++;}render();">${IC.chevR}</button>
      </div>
      <div class="cal-header">
        <div class="cal-hd sun">อา</div><div class="cal-hd">จ</div><div class="cal-hd">อ</div>
        <div class="cal-hd">พ</div><div class="cal-hd">พฤ</div><div class="cal-hd">ศ</div><div class="cal-hd">ส</div>
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend">
        <span><span class="cal-dot available"></span> ว่าง</span>
        <span><span class="cal-dot full"></span> เต็ม</span>
        <span><span class="cal-dot holiday"></span> หยุด</span>
        <span><span class="cal-dot selected"></span> เลือก</span>
      </div>
    </div>
  `;
}

// ---- Render Steps Bar ----

function renderSteps() {
  const labels = ["เลือกวันเวลา", "ข้อมูลรถ & กล้อง", "ข้อมูลผู้จอง", "ยืนยัน"];
  const bar = document.getElementById("stepsBar");
  bar.innerHTML = "";
  labels.forEach((label, i) => {
    const step = i + 1;
    const cls =
      currentStep > step ? "done" : currentStep === step ? "active" : "";
    bar.innerHTML += `
      <div class="step-item">
        <div class="step-circle ${cls}">${currentStep > step
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>'
          : step}</div>
        <span class="step-label ${cls}">${label}</span>
        ${i < 3 ? `<div class="step-line ${currentStep > step ? "done" : ""}"></div>` : ""}
      </div>
    `;
  });
}

// ---- Main Render ----

function render() {
  renderSteps();
  const main = document.getElementById("mainContent");

  // ===== CHECK BOOKING MODE =====
  if (checkMode) {
    document.getElementById("stepsBar").innerHTML = "";
    main.innerHTML = `
      <div class="booking-card fade-in" style="max-width:560px">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          ตรวจสอบสถานะการจอง
        </div>
        <div class="card-desc">กรอกรหัสการจองเพื่อดูสถานะหรือยกเลิกการจอง</div>
        <div class="form-group" style="margin-bottom:16px">
          <label>รหัสการจอง <span class="req">*</span></label>
          <input class="form-input" id="refInput" placeholder="เช่น DDPAI-A3K7X2" style="font-size:18px;font-weight:700;letter-spacing:2px;text-align:center;text-transform:uppercase">
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-back" onclick="checkMode=false;checkedBooking=null;render()">
            ${IC.arrowL} กลับหน้าจอง
          </button>
          <button class="btn-next" style="flex:1" onclick="lookupBooking()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            ค้นหา
          </button>
        </div>
        ${checkedBooking === 'not_found' ? `
          <div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:10px;text-align:center;color:var(--red-700);font-size:13px;font-weight:600">
            ไม่พบรหัสการจองนี้ กรุณาตรวจสอบอีกครั้ง
          </div>
        ` : ''}
        ${checkedBooking && checkedBooking !== 'not_found' ? renderCheckedBooking(checkedBooking) : ''}
      </div>
    `;
    return;
  }

  // ===== SUCCESS PAGE =====
  if (submitted && lastBooking) {
    const settings = getSettings();
    const branch = settings.branches.find((b) => b.id === form.branch);
    const ref = lastBooking.refCode;

    main.innerHTML = `
      <div class="success-page fade-in">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2>จองสำเร็จ!</h2>
        <p>การจองของคุณได้รับการบันทึกเรียบร้อยแล้ว<br>ระบบส่งอีเมลยืนยันไปที่ <strong>${form.email}</strong><br>กรุณารอการยืนยันจากทีมงาน</p>

        <div class="ref-code-box">
          <div class="ref-code-label">รหัสการจอง</div>
          <div class="ref-code">${ref}</div>
          <div class="ref-code-hint">กรุณาจดรหัสนี้ไว้เพื่อตรวจสอบสถานะหรือยกเลิกการจอง</div>
        </div>

        <div class="success-card">
          <h4 style="font-size:14px;font-weight:700;color:var(--slate-800);margin-bottom:14px">รายละเอียดการจอง</h4>
          ${[
            ["รหัสการจอง", ref],
            ["สาขา", branch?.name],
            ["วันที่", thaiDate(form.date)],
            ["เวลา", form.time + " น."],
            ["รุ่นกล้อง", form.cameraModel],
            ["ทะเบียนรถ", form.licensePlate],
            ["รถ", form.carBrand + " " + form.carModel],
            ["การติดตั้ง", form.installType],
            ["ชื่อ", form.name],
            ["เบอร์โทร", form.phone],
            ["อีเมล", form.email],
          ]
            .map(
              ([k, v]) =>
                `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v}</span></div>`
            )
            .join("")}
        </div>

        <div class="success-actions">
          <button class="btn-new" onclick="checkMode=true;checkedBooking=null;render()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            ตรวจสอบสถานะการจอง
          </button>
          <button class="btn-new" style="background:var(--slate-200);color:var(--slate-700)" onclick="resetForm()">จองใหม่อีกครั้ง</button>
        </div>
      </div>
    `;
    return;
  }

  const settings = getSettings();

  // ===== STEP 1: Date & Time =====
  if (currentStep === 1) {
    const availSlots = form.date ? getAvailableSlots(form.date) : [];
    main.innerHTML = `
      <div class="booking-card fade-in">
        <div class="card-title">${IC.calendar} เลือกสาขา วันที่ และเวลา</div>
        <div class="card-desc">เลือกสาขาและช่วงเวลาที่ต้องการเข้ารับบริการติดตั้ง</div>

        <div class="form-grid">
          <div class="form-group">
            <label>สาขา <span class="req">*</span></label>
            <select class="form-select" onchange="form.branch=this.value">
              ${settings.branches
                .map(
                  (b) =>
                    `<option value="${b.id}" ${form.branch === b.id ? "selected" : ""}>${b.name} — ${b.address}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>เลือกวันที่ <span class="req">*</span></label>
            ${buildCalendar()}
          </div>
          ${
            form.date
              ? `
          <div class="time-section form-group">
            <label>เวลาที่ว่าง — ${thaiDate(form.date)} <span class="req">*</span></label>
            ${
              availSlots.length === 0
                ? '<p style="color:var(--red-500);font-size:14px">ไม่มีช่วงเวลาว่างในวันนี้</p>'
                : `<div class="time-grid">
                ${availSlots
                  .map(
                    (t) =>
                      `<button type="button" class="time-btn ${form.time === t ? "selected" : ""}" onclick="selectTime('${t}')">${t}</button>`
                  )
                  .join("")}
              </div>`
            }
          </div>`
              : ""
          }
        </div>
        <div class="btn-row">
          <div></div>
          <button class="btn-next" ${canGoNext() ? "" : "disabled"} onclick="nextStep()">ถัดไป ${IC.arrowR}</button>
        </div>
      </div>
    `;
  }

  // ===== STEP 2: Vehicle & Camera =====
  else if (currentStep === 2) {
    main.innerHTML = `
      <div class="booking-card fade-in">
        <div class="card-title">${IC.car} ข้อมูลรถยนต์ & กล้อง</div>
        <div class="card-desc">กรอกรายละเอียดเกี่ยวกับรถและกล้องที่ต้องการติดตั้ง</div>

        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>หมายเลขคำสั่งซื้อ <span class="req">*</span></label>
            <input class="form-input" id="f_orderNumber" value="${form.orderNumber}" placeholder="เช่น SHP-20260401" oninput="form.orderNumber=this.value">
          </div>
          <div class="form-group">
            <label>ช่องทางการซื้อ <span class="req">*</span></label>
            <select class="form-select" id="f_channel" onchange="form.channel=this.value">
              <option value="">-- เลือกช่องทาง --</option>
              ${CHANNELS.map((c) => `<option value="${c}" ${form.channel === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>รุ่นกล้องที่นำมาติด <span class="req">*</span></label>
            <select class="form-select" id="f_cameraModel" onchange="onCameraSelect(this.value)">
              <option value="">-- เลือกรุ่นกล้อง --</option>
              ${settings.cameraModels.map((c) => `<option value="${c}" ${form.cameraModel === c ? "selected" : ""}>${c}</option>`).join("")}
              <option value="__other" ${form.cameraModel && !settings.cameraModels.includes(form.cameraModel) ? "selected" : ""}>อื่นๆ (พิมพ์เอง)</option>
            </select>
            <input class="form-input" id="f_cameraModelCustom" placeholder="พิมพ์รุ่นกล้อง" value="${form.cameraModel && !settings.cameraModels.includes(form.cameraModel) ? form.cameraModel : ''}" oninput="form.cameraModel=this.value" style="margin-top:6px;display:${form.cameraModel && !settings.cameraModels.includes(form.cameraModel) ? 'block' : 'none'}"  >
          </div>
          <div class="form-group">
            <label>ทะเบียนรถ <span class="req">*</span></label>
            <input class="form-input" id="f_licensePlate" value="${form.licensePlate}" placeholder="เช่น กข 1234" oninput="form.licensePlate=this.value">
          </div>
          <div class="form-group">
            <label>ยี่ห้อรถ <span class="req">*</span></label>
            <input class="form-input" id="f_carBrand" value="${form.carBrand}" placeholder="เช่น Honda, Toyota" oninput="form.carBrand=this.value">
          </div>
          <div class="form-group">
            <label>รุ่นรถ <span class="req">*</span></label>
            <input class="form-input" id="f_carModel" value="${form.carModel}" placeholder="เช่น Civic, Yaris" oninput="form.carModel=this.value">
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label>ประเภทรถ <span class="req">*</span></label>
            <select class="form-select" id="f_carType" onchange="form.carType=this.value">
              <option value="">-- เลือกประเภทรถ --</option>
              ${CAR_TYPES.map((c) => `<option value="${c}" ${form.carType === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label>ประเภทการติดตั้ง (คันที่ 1) <span class="req">*</span></label>
            <select class="form-select" id="f_installType" onchange="form.installType=this.value">
              <option value="">-- เลือกประเภทการติดตั้ง --</option>
              ${INSTALL_TYPES.map((c) => `<option value="${c}" ${form.installType === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn-back" onclick="prevStep()">${IC.arrowL} ย้อนกลับ</button>
          <button class="btn-next" onclick="syncFormAndNext()">ถัดไป ${IC.arrowR}</button>
        </div>
      </div>
    `;
  }

  // ===== STEP 3: Contact =====
  else if (currentStep === 3) {
    main.innerHTML = `
      <div class="booking-card fade-in">
        <div class="card-title">${IC.user} ข้อมูลผู้จอง</div>
        <div class="card-desc">กรอกข้อมูลติดต่อเพื่อยืนยันการจอง</div>

        <div class="form-grid">
          <div class="form-group">
            <label>ชื่อ-นามสกุล <span class="req">*</span></label>
            <input class="form-input" id="f_name" value="${form.name}" placeholder="ชื่อ นามสกุล" oninput="form.name=this.value">
          </div>
          <div class="form-grid form-grid-2">
            <div class="form-group">
              <label>เบอร์โทร <span class="req">*</span></label>
              <input class="form-input" id="f_phone" value="${form.phone}" placeholder="08X-XXX-XXXX" oninput="form.phone=this.value">
            </div>
            <div class="form-group">
              <label>อีเมล <span class="req">*</span></label>
              <input class="form-input" type="email" id="f_email" value="${form.email}" placeholder="example@email.com" oninput="form.email=this.value">
            </div>
          </div>
          <div class="form-group">
            <label>หมายเหตุ</label>
            <textarea class="form-textarea" id="f_notes" placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)" oninput="form.notes=this.value">${form.notes}</textarea>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn-back" onclick="prevStep()">${IC.arrowL} ย้อนกลับ</button>
          <button class="btn-next" onclick="syncFormAndNext()">ถัดไป ${IC.arrowR}</button>
        </div>
      </div>
    `;
  }

  // ===== STEP 4: Confirm =====
  else if (currentStep === 4) {
    const branch = settings.branches.find((b) => b.id === form.branch);
    main.innerHTML = `
      <div class="booking-card fade-in">
        <div class="card-title">${IC.check} ยืนยันการจอง</div>
        <div class="card-desc">ตรวจสอบข้อมูลทั้งหมดก่อนยืนยันการจอง</div>

        <div class="summary-section">
          <h4>สาขา & เวลา</h4>
          ${[
            ["สาขา", branch?.name],
            ["วันที่", thaiDate(form.date)],
            ["เวลา", form.time + " น."],
          ]
            .map(([k, v]) => `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v}</span></div>`)
            .join("")}
        </div>
        <div class="summary-section">
          <h4>ข้อมูลรถ & กล้อง</h4>
          ${[
            ["หมายเลขคำสั่งซื้อ", form.orderNumber],
            ["ช่องทาง", form.channel],
            ["รุ่นกล้อง", form.cameraModel],
            ["ทะเบียนรถ", form.licensePlate],
            ["ยี่ห้อ / รุ่น", form.carBrand + " " + form.carModel],
            ["ประเภทรถ", form.carType],
            ["การติดตั้ง", form.installType],
          ]
            .map(([k, v]) => `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v}</span></div>`)
            .join("")}
        </div>
        <div class="summary-section">
          <h4>ผู้จอง</h4>
          ${[
            ["ชื่อ-นามสกุล", form.name],
            ["เบอร์โทร", form.phone],
            ["อีเมล", form.email],
            ...(form.notes ? [["หมายเหตุ", form.notes]] : []),
          ]
            .map(([k, v]) => `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v}</span></div>`)
            .join("")}
        </div>

        <div class="btn-row">
          <button class="btn-back" onclick="prevStep()">${IC.arrowL} ย้อนกลับ</button>
          <button class="btn-confirm" onclick="submitBooking()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            ยืนยันการจอง
          </button>
        </div>
      </div>
    `;
  }
}

// ---- Actions ----

function selectDate(d) {
  form.date = d;
  form.time = "";
  render();
}

function selectTime(t) {
  form.time = t;
  render();
}

function nextStep() {
  if (canGoNext()) {
    currentStep++;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function prevStep() {
  currentStep--;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function onCameraSelect(val) {
  const custom = document.getElementById("f_cameraModelCustom");
  if (val === "__other") {
    custom.style.display = "block";
    custom.focus();
    form.cameraModel = custom.value;
  } else {
    custom.style.display = "none";
    form.cameraModel = val;
  }
}

function onEditCameraSelect(val) {
  const custom = document.getElementById("ed_cameraModelCustom");
  if (val === "__other") {
    custom.style.display = "block";
    custom.focus();
  } else {
    custom.style.display = "none";
  }
}

function syncFormAndNext() {
  const fields = [
    "orderNumber","channel","cameraModel","licensePlate",
    "carBrand","carModel","carType","installType",
    "name","phone","email","notes",
  ];
  fields.forEach((key) => {
    const el = document.getElementById("f_" + key);
    if (el) form[key] = el.value;
  });
  // Handle custom camera model
  if (form.cameraModel === "__other") {
    const custom = document.getElementById("f_cameraModelCustom");
    form.cameraModel = custom ? custom.value : "";
  }
  if (canGoNext()) nextStep();
}

async function submitBooking() {
  lastBooking = await addBooking({ ...form, status: "pending" });
  submitted = true;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  Object.keys(form).forEach((k) => (form[k] = ""));
  form.branch = "pinklao";
  submitted = false;
  lastBooking = null;
  checkMode = false;
  checkedBooking = null;
  currentStep = 1;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Booking Lookup ----

function lookupBooking() {
  const input = document.getElementById("refInput");
  const ref = input.value.trim().toUpperCase();
  if (!ref) return;
  const found = findBookingByRef(ref);
  checkedBooking = found || "not_found";
  render();
}

async function cancelMyBooking(refCode) {
  if (!confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?")) return;
  const ok = await cancelBookingByRef(refCode);
  if (ok) {
    checkedBooking = findBookingByRef(refCode);
    render();
  }
}

function renderCheckedBooking(b) {
  const settings = getSettings();
  const branch = settings.branches.find(br => br.id === b.branch);
  const statusInfo = STATUS_MAP[b.status] || {};
  const canEdit = b.status === "pending";
  const canCancel = b.status !== "cancelled" && b.status !== "completed";

  // ---- EDIT MODE ----
  if (editMode && canEdit) {
    const availSlots = b.date ? getAvailableSlots(b.date) : [];
    // Add back the currently booked slot (since it's this booking's own slot)
    if (b.time && !availSlots.includes(b.time)) availSlots.push(b.time);
    availSlots.sort();

    return `
      <div class="checked-result">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:700;color:var(--slate-800);margin:0">แก้ไขข้อมูลการจอง</h3>
          <span class="badge badge-pending" style="font-size:12px;padding:4px 12px">${b.refCode}</span>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>วันที่ <span class="req">*</span></label>
            <input type="date" class="form-input" id="ed_date" value="${b.date}" onchange="onEditDateChange()">
          </div>
          <div class="form-group">
            <label>เวลา <span class="req">*</span></label>
            <select class="form-select" id="ed_time">
              ${availSlots.map(t => `<option value="${t}" ${t === b.time ? 'selected' : ''}>${t}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-grid form-grid-2">
          <div class="form-group">
            <label>ชื่อ-นามสกุล <span class="req">*</span></label>
            <input class="form-input" id="ed_name" value="${b.name}">
          </div>
          <div class="form-group">
            <label>เบอร์โทร <span class="req">*</span></label>
            <input class="form-input" id="ed_phone" value="${b.phone}">
          </div>
          <div class="form-group">
            <label>อีเมล <span class="req">*</span></label>
            <input class="form-input" type="email" id="ed_email" value="${b.email}">
          </div>
          <div class="form-group">
            <label>รุ่นกล้อง</label>
            <select class="form-select" id="ed_cameraModel" onchange="onEditCameraSelect(this.value)">
              ${settings.cameraModels.map(c => `<option value="${c}" ${c === b.cameraModel ? 'selected' : ''}>${c}</option>`).join("")}
              <option value="__other" ${b.cameraModel && !settings.cameraModels.includes(b.cameraModel) ? "selected" : ""}>อื่นๆ (พิมพ์เอง)</option>
            </select>
            <input class="form-input" id="ed_cameraModelCustom" placeholder="พิมพ์รุ่นกล้อง" value="${b.cameraModel && !settings.cameraModels.includes(b.cameraModel) ? b.cameraModel : ''}" style="margin-top:6px;display:${b.cameraModel && !settings.cameraModels.includes(b.cameraModel) ? 'block' : 'none'}"  >
          </div>
          <div class="form-group">
            <label>ทะเบียนรถ</label>
            <input class="form-input" id="ed_licensePlate" value="${b.licensePlate}">
          </div>
          <div class="form-group">
            <label>ยี่ห้อรถ</label>
            <input class="form-input" id="ed_carBrand" value="${b.carBrand}">
          </div>
          <div class="form-group">
            <label>รุ่นรถ</label>
            <input class="form-input" id="ed_carModel" value="${b.carModel}">
          </div>
          <div class="form-group">
            <label>ประเภทรถ</label>
            <select class="form-select" id="ed_carType">
              ${CAR_TYPES.map(c => `<option value="${c}" ${c === b.carType ? 'selected' : ''}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>ประเภทการติดตั้ง</label>
          <select class="form-select" id="ed_installType">
            ${INSTALL_TYPES.map(c => `<option value="${c}" ${c === b.installType ? 'selected' : ''}>${c}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>หมายเหตุ</label>
          <textarea class="form-textarea" id="ed_notes">${b.notes || ''}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn-back" style="flex:1" onclick="editMode=false;render()">ยกเลิกการแก้ไข</button>
          <button class="btn-next" style="flex:1" onclick="saveEditBooking('${b.refCode}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    `;
  }

  // ---- VIEW MODE ----
  return `
    <div class="checked-result">
      <div class="checked-status">
        <span class="badge badge-${b.status}" style="font-size:14px;padding:6px 18px">${statusInfo.label || b.status}</span>
      </div>
      <div class="checked-ref">${b.refCode}</div>

      <div class="checked-progress">
        <div class="cp-step ${b.status !== 'cancelled' ? 'done' : 'cancelled'}">
          <div class="cp-circle done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg></div>
          <span>จองแล้ว</span>
        </div>
        <div class="cp-line ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : ''}"></div>
        <div class="cp-step ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : ''}">
          <div class="cp-circle ${b.status === 'confirmed' || b.status === 'completed' ? 'done' : ''}">${b.status === 'confirmed' || b.status === 'completed' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' : '2'}</div>
          <span>ยืนยัน</span>
        </div>
        <div class="cp-line ${b.status === 'completed' ? 'done' : ''}"></div>
        <div class="cp-step ${b.status === 'completed' ? 'done' : ''}">
          <div class="cp-circle ${b.status === 'completed' ? 'done' : ''}">3</div>
          <span>เสร็จสิ้น</span>
        </div>
      </div>

      ${b.status === 'cancelled' ? '<div style="text-align:center;padding:10px;background:#fef2f2;border-radius:8px;color:var(--red-700);font-size:13px;font-weight:600;margin-bottom:12px">การจองนี้ถูกยกเลิกแล้ว</div>' : ''}

      <div class="checked-details">
        ${[
          ["สาขา", branch?.name],
          ["วันที่", thaiDate(b.date)],
          ["เวลา", b.time + " น."],
          ["ชื่อ", b.name],
          ["เบอร์โทร", b.phone],
          ["อีเมล", b.email],
          ["รุ่นกล้อง", b.cameraModel],
          ["ทะเบียน", b.licensePlate],
          ["รถ", b.carBrand + " " + b.carModel],
          ["การติดตั้ง", b.installType],
          ["หมายเลขคำสั่งซื้อ", b.orderNumber],
          ["ช่องทาง", b.channel],
          ...(b.notes ? [["หมายเหตุ", b.notes]] : []),
        ].map(([k,v]) => `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v || '-'}</span></div>`).join("")}
      </div>

      <div class="checked-actions">
        ${canEdit ? `
          <button class="btn-edit-booking" onclick="editMode=true;render()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            แก้ไขข้อมูลการจอง
          </button>
        ` : ''}
        ${canCancel ? `
          <button class="btn-cancel-booking" onclick="cancelMyBooking('${b.refCode}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ยกเลิกการจอง
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ---- Edit helpers ----

function onEditDateChange() {
  const dateVal = document.getElementById("ed_date").value;
  if (!dateVal) return;
  const b = checkedBooking;
  const avail = getAvailableSlots(dateVal);
  // Keep current slot if same date
  if (b.date === dateVal && b.time && !avail.includes(b.time)) avail.push(b.time);
  avail.sort();
  const sel = document.getElementById("ed_time");
  sel.innerHTML = avail.length === 0
    ? '<option value="">ไม่มีเวลาว่าง</option>'
    : avail.map(t => `<option value="${t}">${t}</option>`).join("");
}

async function saveEditBooking(refCode) {
  const updates = {
    date: document.getElementById("ed_date").value,
    time: document.getElementById("ed_time").value,
    name: document.getElementById("ed_name").value,
    phone: document.getElementById("ed_phone").value,
    email: document.getElementById("ed_email").value,
    cameraModel: document.getElementById("ed_cameraModel").value === "__other" ? document.getElementById("ed_cameraModelCustom").value : document.getElementById("ed_cameraModel").value,
    licensePlate: document.getElementById("ed_licensePlate").value,
    carBrand: document.getElementById("ed_carBrand").value,
    carModel: document.getElementById("ed_carModel").value,
    carType: document.getElementById("ed_carType").value,
    installType: document.getElementById("ed_installType").value,
    notes: document.getElementById("ed_notes").value,
  };

  if (!updates.date || !updates.time || !updates.name || !updates.phone || !updates.email) {
    alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
    return;
  }

  const ok = await updateBookingByRef(refCode, updates);
  if (ok) {
    editMode = false;
    checkedBooking = findBookingByRef(refCode);
    render();
    alert("บันทึกการแก้ไขเรียบร้อยแล้ว");
  } else {
    alert("ไม่สามารถแก้ไขได้ — การจองอาจถูกยืนยันหรือยกเลิกแล้ว");
  }
}

// ---- Init: wait for Supabase data ----
dataReady.then(() => render());
