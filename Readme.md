# HireFlow 🚀 | Modern AI-Powered Applicant Tracking System (ATS)

![Banner](https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop)

HireFlow is a premium, high-performance Applicant Tracking System (ATS) built with **Next.js 15**, **Prisma**, and **Google Gemini AI**. Designed for speed, aesthetics, and intelligence, HireFlow streamlines the recruitment process for Super Admins, HR Managers, Teams, and Candidates.

---

## ✨ Key Features

- 🤖 **AI CV Screening**: Automated resume analysis using Google Gemini 1.5 Flash to score candidates against job descriptions.
- 🏢 **Multi-Tenant Architecture**: Robust support for multiple organizations/tenants with isolated data.
- 🔐 **Role-Based Access Control (RBAC)**: Dedicated dashboards for 4 distinct user roles.
- 📧 **Automated Communication**: Integrated email notifications via Resend.
- 📊 **Real-time Analytics**: Beautiful, interactive dashboards for recruitment data and system oversight.
- 🎨 **Premium UI**: Crafted with a modern, glassmorphic aesthetic using Tailwind CSS.

---

## 🖥️ The 4 Power Dashboards

### 1. Super Admin Panel
The global command center for platform administrators. Manage tenants, monitor system-wide usage metrics, and handle global configurations.
![Super Admin](/public/screenshots/SuperAdmin_Dashboard.png)

### 2. HR Admin Panel
The primary workspace for recruiters. Post jobs, manage interview pipelines, and view AI-driven candidate rankings at a glance.
![HR Admin](/public/screenshots/HRAdmin_Dashboard.png)

### 3. Team Member Dashboard
Focused on collaborative hiring. Review assigned candidates, submit feedback forms, and manage personal interview schedules.
![Team Member](/public/screenshots/TeamMember_Dashboard.png)

### 4. Candidate Portal
An empowering interface for job seekers. Track application status, complete profiles, and view AI-powered resume improvement suggestions.
![Candidate](/public/screenshots/CandidateAdmin_Dashboard.png)

### 5. Home Page
![Home Page](/public/screenshots/Website_Home_Page.png)

### 6. Login Page
![Login Page](/public/screenshots/Website_Login_Page.png)

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google OAuth & Credentials)
- **AI Engine**: [Google Gemini 1.5 Flash](https://aistudio.google.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Email**: [Resend](https://resend.com/)
- **Monitoring**: [Sentry](https://sentry.io/) & [Microsoft Clarity](https://clarity.microsoft.com/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or later
- A PostgreSQL database instance

### 2. Installation
```bash
git clone https://github.com/your-username/hireflow-ats.git
cd hireflow-ats
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL="your-postgresql-url"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
GEMINI_API_KEY="your-gemini-key"
RESEND_API_KEY="your-resend-key"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with Claude for the future of hiring.
copyright 2026 with codiste x fluteofthecode