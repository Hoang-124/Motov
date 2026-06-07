# Motov - Motorcycle Rental Platform

Motov is a modern motorcycle rental web application built with a React frontend (Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion) and an Express backend (Node.js, TypeScript, TSX, MongoDB, Mongoose).

## Core Modules

### 1. Admin User Management Module
Administrators can securely manage system users (Admins, Staff, Owners, and Customers) from the Admin panel:
- **User List**: Search by name/email/username/phone, filter by roles and account statuses.
- **User Detail**: Comprehensive viewer showing profile values (dates, gender, dob, phone number, etc.).
- **Create User Form**: Form validation, username and email duplicate checking, and password hashing.
- **Update User Form**: Allows editing profile details, role reassignment, and optional password changes. Includes safety guards that prevent admins from locking themselves out (cannot demote or disable their own active account).
- **Ban & Unban Account Function**: Restricts or restores user access (toggle `Suspended`/`Active` status) with validation. Prevents admins from locking or deleting their own active profile.


For API endpoints, request bodies, and details, see the [User Management API Docs](file:///C:/Users/admin/.gemini/antigravity-ide/brain/15a77dfb-8289-4e71-a10d-9f762392d5d6/user_management_docs.md).

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on port `27017` (default database: `mongodb://localhost:27017/Motov`)

### Installation
Run the following script at the root directory to install all dependencies for the workspace, client, server, and mobile folders:
```bash
npm run install:all
```

### Running the App
Start both the client (port 3000) and backend server (port 5000) concurrently using:
```bash
npm run dev
```
*(If port 5000 is occupied, you can run `npm run dev:safe` to kill the process listening on port 5000 first, then start the servers).*

### Default Seed Accounts
Upon connecting to MongoDB, the backend automatically seeds the database with the following testing accounts:
- **Admin**: `admin@motov.com` / Password: `123456`
- **Staff**: `nhanvien@motov.com` / Password: `123456`
- **Owner**: `owner@motov.com` / Password: `123456`
- **Customer**: `khachhang@motov.com` / Password: `123456`
