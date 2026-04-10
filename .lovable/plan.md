

# AI-Assisted Service Deviation & Approval Workflow Platform

## Overview
A cinematic, immersive enterprise control center for Telecom & Media operations with 3D visuals, glassmorphism UI, and a complete deviation request workflow. All 8 screens built with balanced 3D performance.

## Design System
- **Theme**: Deep space enterprise — dark bg (#0a0a0f), electric blue (#00d4ff), violet (#7c3aed), amber warnings, emerald approvals, red rejections
- **Cards**: Glassmorphism with backdrop-blur, subtle border glow
- **Fonts**: Inter (UI) + JetBrains Mono (data/codes)
- **Animations**: Framer Motion for all transitions, no hard cuts

## Dependencies to Install
- `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160` — 3D elements
- `framer-motion` — micro-animations
- `recharts` — analytics charts

## Screens (8 total)

### 1. Login / Role Selection
- 3D rotating globe with telecom signal arcs (React Three Fiber)
- 6 glassmorphism role cards with rotating 3D icons and glow on hover
- Supabase auth integration (email/password login, then role selection)
- Smooth zoom transition into dashboard on role select

### 2. Main Command Center Dashboard
- 3D particle mesh network background (optimized particle count for performance)
- Glassmorphism top nav: logo, role badge, notification bell, avatar, logout
- Collapsible left sidebar with all 8 nav items (using Shadcn sidebar)
- KPI cards with 3D flip animation: Active Deviations, Pending Approvals, SLA Breached, AI Risk Score Avg
- Horizontal workflow pipeline visualization with glowing orbs traveling through stages
- Recent activity feed with animated entry

### 3. New Deviation Request Form
- Multi-step wizard with 3D floating step indicators
- Step 1: Deviation details (account ID, type selector as animated cards, contract ref, value, dates, urgency)
- Step 2: Business justification with "Generate AI Justification" button (animated AI thinking state, typewriter output), AI Risk Score gauge, policy reference cards
- Step 3: Review & submit with approval chain preview, SLA timer, confirmation animation

### 4. Approval Dashboard
- Split layout: pending request queue (left) with risk badges, urgency indicators, SLA countdown
- Detail panel (right): request summary, AI justification, risk breakdown, policy refs, approval history thread
- Action buttons: Approve (green glow) / Reject (red glow) / Request More Info (amber)
- Escalation alert banner when SLA < 2 hours

### 5. Workflow Tracker
- Timeline with 3D milestone nodes (completed/active/pending states)
- Expandable stages showing actor, timestamp, AI recommendation, comments
- Real-time SLA countdown bar

### 6. Audit Log
- Full-width table with glassmorphism styling, glow-on-hover rows
- Filters: date range, deviation type, role, status
- Expandable rows for full decision thread
- CSV export button

### 7. Analytics Page
- Recharts visualizations: bar chart (requests by type/month), line chart (SLA breach trends), donut chart (approval/rejection rate), heatmap (risk distribution)
- AI Insight panel with generated summary text

### 8. Policy Library (RAG Interface)
- Search bar "Ask the Policy AI"
- Animated AI processing state on query
- Citation cards: policy clause, excerpt, confidence score, source tag
- Query history in left panel

## Data & State Management
- Comprehensive mock data: 5 deviation requests across stages, 3 user roles with different queues, sample AI justifications, risk scores, policy clauses
- React Query for all data fetching (mock API service layer structured for real API swap)
- Role-based rendering: nav items and actions filtered by role
- Sonner toast notifications for all actions

## Authentication
- Supabase auth with email/password (requires connecting Supabase or Lovable Cloud)
- Post-login role selection stored in user context
- Role-based route guards

## 3D Performance (Balanced Approach)
- Particle counts capped for mid-range devices
- `useFrame` throttling where possible
- Suspense/lazy loading for 3D scenes
- Reduced effects on mobile viewports

