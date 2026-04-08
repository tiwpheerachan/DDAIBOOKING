# DDPAI Dashcam Installation Booking System

ระบบจองติดตั้งกล้องติดรถยนต์ DDPAI — Susco Pinklao

## โครงสร้างโปรเจกต์

```
ddpai-booking-system/
├── index.html              ← หน้า User (จองติดตั้ง)
├── admin.html              ← หน้า Admin (จัดการระบบ)
├── css/
│   ├── common.css          ← Styles ที่ใช้ร่วมกัน
│   ├── user.css            ← Styles เฉพาะหน้า User
│   └── admin.css           ← Styles เฉพาะหน้า Admin
├── js/
│   ├── shared-data.js      ← Data Layer (localStorage) ใช้ร่วมกัน
│   ├── user-booking.js     ← Logic หน้า User
│   └── admin-panel.js      ← Logic หน้า Admin
├── assets/                 ← รูปภาพ / ไอคอน (ถ้ามี)
├── .vscode/
│   ├── settings.json       ← VS Code settings
│   └── extensions.json     ← Extensions ที่แนะนำ
├── package.json
└── README.md
```

## วิธีเปิดใช้งาน

### วิธีที่ 1: Live Server (แนะนำ)

1. เปิดโปรเจกต์ใน VS Code
2. ติดตั้ง Extension **Live Server** (ถ้ายังไม่มี)
3. คลิกขวาที่ `index.html` → **Open with Live Server**
4. เปิด `admin.html` ในแท็บใหม่เพื่อเข้าหน้า Admin

### วิธีที่ 2: npm script

```bash
npm run dev     # เปิดหน้า User
npm run admin   # เปิดหน้า Admin
```

### วิธีที่ 3: เปิดไฟล์ตรง

ดับเบิลคลิก `index.html` หรือ `admin.html` เปิดในเบราว์เซอร์ได้เลย

## ฟีเจอร์

### หน้า User (index.html)

- เลือกสาขา, วันที่, เวลาที่ว่าง
- กรอกข้อมูลคำสั่งซื้อ, ช่องทางการซื้อ, รุ่นกล้อง
- กรอกข้อมูลรถ (ทะเบียน, ยี่ห้อ, รุ่น, ประเภทรถ, ประเภทการติดตั้ง)
- กรอกข้อมูลผู้จอง (ชื่อ, เบอร์, อีเมล, หมายเหตุ)
- ตรวจสอบและยืนยันการจอง
- เวลาที่ถูกจองแล้วจะหายไปอัตโนมัติ

### หน้า Admin (admin.html)

- **Dashboard** — ภาพรวมจำนวนจอง, ตารางวันนี้, ปุ่มจองให้ลูกค้า
- **ตารางงาน** — ดูรายละเอียดทุก slot ในแต่ละวัน
- **รายการจอง** — ตารางทุกรายการ, กรองตามสถานะ, ยืนยัน/เสร็จ/ยกเลิก
- **จัดการเวลา** — เปิด/ปิดช่วงเวลาเฉพาะวัน
- **ตั้งค่า** — เวลาเปิด-ปิด, ช่วงเวลา, พักเบรค, จัดการรุ่นกล้อง

## การเชื่อมต่อ

ทั้ง 2 หน้าใช้ `localStorage` เป็น Database ร่วมกัน:
- User จองคิว → Admin เห็นทันที
- Admin ปิดเวลา → User จองเวลานั้นไม่ได้
- Admin เพิ่มรุ่นกล้อง → User เห็นตัวเลือกใหม่
