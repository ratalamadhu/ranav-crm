# Ranav Group CRM — Claude Code Build Guide

> **IMPORTANT FOR CLAUDE CODE**: Read this entire file before writing any code.
> Follow phases strictly in order. Never skip ahead. Complete all checklist items
> in a phase before moving to the next. Ask for confirmation before starting each phase.

---

## Project Overview

**Client**: Ranav Group — Real Estate & Construction  
**App Name**: Ranav CRM  
**URL**: crm.anvayagrove.com (Cloudflare Workers)  
**Backend**: InsForge (Postgres + Auth + Storage + Realtime)  
**Frontend**: React + Tailwind CSS + Vite  
**Goal**: A production CRM for managing real estate leads, inventory, clients, and agents

---

## Agent Password Reset — SOP

> Follow these steps every time an agent forgets their password or needs a reset.
> InsForge has NO admin password reset API or dashboard UI — SQL is the only way.

### Step 1 — Get the agent's user ID

```bash
curl -s "https://rx823jh5.ap-southeast.insforge.app/api/auth/users" \
  -H "Authorization: Bearer YOUR_AISENSY_API_KEY" | \
  node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); j.data.forEach(u=>console.log(u.email, u.id))"
```

Or look up in the list and note the UUID for the target agent.

**Known agent IDs (update as agents are added):**

| Email | UUID |
|---|---|
| agent1@ranavgroup.com | f8962473-02c7-4f41-bf8e-614c8bf3a5a4 |
| agent2@ranavgroup.com | cbdb9bd4-d056-4b9a-abe1-77f75ed5ab92 |
| coordinator@ranavgroup.com | fdd312f9-801b-4025-af39-6c78af0b1b52 |
| md@ranavgroup.com | f33544b2-88d3-468a-ab03-f3d17800379e |
| madhu@ranavgroup.com (admin) | ff9537b7-2f58-4596-9735-1b2514ffdc0e |

### Step 2 — Reset password via InsForge MCP

Use the InsForge MCP `run-raw-sql` tool (works from this project directory):

```sql
-- Replace <UUID> and <newpassword> below
UPDATE auth.users
SET password = crypt('<newpassword>', gen_salt('bf'))
WHERE id = '<UUID>';
```

### Step 3 — Force password reset on next login

```sql
UPDATE user_profiles
SET force_password_reset = true
WHERE id = '<UUID>';
```

This forces the agent to set their own personal password when they log in.

### Notes
- Default temp password convention: `Nano@1234` (change per agent if needed)
- The InsForge MCP must be run from the `ranav-crm/` project directory (`.mcp.json` is there)
- The `force_password_reset` flag is cleared automatically once the agent sets their new password

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | InsForge (via MCP) |
| Database | Postgres (InsForge managed) |
| Auth | InsForge Auth |
| Storage | InsForge Storage |
| Deployment | Cloudflare Workers + Pages |
| Domain | crm.anvayagrove.com |
| Notifications | WhatsApp Business API (Phase 3+) |

---

## Brand Colors

```css
--brand-blue:  #1B3A6B   /* Primary — headers, nav, buttons */
--brand-gold:  #C9922A   /* Accent — highlights, badges */
--brand-green: #1A7A3A   /* Success — available, confirmed */
--brand-red:   #AA2222   /* Danger — overdue, sold, lost */
--light-blue:  #EAF0FB   /* Background tint */
--light-gold:  #FDF6E3   /* Background tint */
```

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access — Madhu only |
| `md` | Full business visibility, no user management |
| `director` | Same as MD for sales data |
| `agent` | Own leads only |
| `coordinator` | Site visit calendar only |

---

## Folder Structure

```
ranav-crm/
├── CLAUDE.md                  ← This file (always read first)
├── .env.local                 ← InsForge keys (never commit)
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── insforge.js            ← InsForge client singleton
    ├── constants/
    │   ├── roles.js
    │   ├── leadSources.js
    │   ├── pipelineStages.js
    │   └── projects.js
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useLeads.js
    │   ├── useAgents.js
    │   └── useRealtime.js
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   ├── TopBar.jsx
    │   │   └── Layout.jsx
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Card.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   └── Table.jsx
    │   └── leads/
    │       ├── LeadCard.jsx
    │       ├── LeadForm.jsx
    │       ├── LeadDetail.jsx
    │       ├── KanbanBoard.jsx
    │       └── KanbanColumn.jsx
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── Leads.jsx
        ├── LeadDetailPage.jsx
        ├── Agents.jsx          ← Phase 2
        ├── Inventory.jsx       ← Phase 3
        └── Reports.jsx         ← Phase 4
```

---

## Database Schema (InsForge / Postgres)

### Create these tables in order using InsForge MCP:

```sql
-- 1. Users (handled by InsForge Auth + this table for extra fields)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  mobile TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','md','director','agent','coordinator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('plot','apartment','mixed')),
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  source TEXT CHECK (source IN ('website','instagram_fb','99acres','magicbricks','walkin','referral','channel_partner')),
  property_interest TEXT CHECK (property_interest IN ('plot','apartment','both')),
  project_id UUID REFERENCES projects(id),
  budget_range TEXT,
  tags TEXT[],
  pipeline_stage TEXT DEFAULT 'new_lead' CHECK (pipeline_stage IN (
    'new_lead','contacted','site_visit_scheduled',
    'site_visit_done','negotiation','booking_done','lost'
  )),
  assigned_to UUID REFERENCES user_profiles(id),
  follow_up_at TIMESTAMPTZ,
  lost_reason TEXT,
  competitor TEXT,
  referral_by TEXT,
  notes TEXT,
  first_contact_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- 4. Lead Notes (immutable log)
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  agent_id UUID REFERENCES user_profiles(id) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activity Audit Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed Data (run after creating tables):

```sql
-- Insert default projects
INSERT INTO projects (name, type, location) VALUES
  ('Anvaya Grove', 'plot', 'Bangalore'),
  ('Ranav Apartments', 'apartment', 'Bangalore');
```

---

## Environment Variables

Create `.env.local` in project root:

```env
VITE_INSFORGE_URL=your_insforge_project_url
VITE_INSFORGE_ANON_KEY=your_insforge_anon_key
```

---

## Constants Reference

### Pipeline Stages
```js
export const PIPELINE_STAGES = [
  { id: 'new_lead',              label: 'New Lead',              color: '#6B7280' },
  { id: 'contacted',             label: 'Contacted',             color: '#3B82F6' },
  { id: 'site_visit_scheduled',  label: 'Visit Scheduled',       color: '#8B5CF6' },
  { id: 'site_visit_done',       label: 'Visit Done',            color: '#F59E0B' },
  { id: 'negotiation',           label: 'Negotiation',           color: '#EF4444' },
  { id: 'booking_done',          label: 'Booking Done',          color: '#10B981' },
  { id: 'lost',                  label: 'Lost',                  color: '#374151' },
]
```

### Lead Sources
```js
export const LEAD_SOURCES = [
  { id: 'website',         label: 'Website' },
  { id: 'instagram_fb',    label: 'Instagram / Facebook' },
  { id: '99acres',         label: '99acres' },
  { id: 'magicbricks',     label: 'MagicBricks' },
  { id: 'walkin',          label: 'Walk-in' },
  { id: 'referral',        label: 'Referral' },
  { id: 'channel_partner', label: 'Channel Partner' },
]
```

### Lead Tags
```js
export const LEAD_TAGS = [
  'NRI', 'Investor', 'Urgent Buyer', 'High Budget',
  'VIP Referral', 'Repeat Customer', 'Home Loan Required'
]
```

### Budget Ranges
```js
export const BUDGET_RANGES = [
  'Below 50L', '50L - 75L', '75L - 1Cr',
  '1Cr - 1.5Cr', '1.5Cr - 2Cr', 'Above 2Cr'
]
```

### Lost Reasons
```js
export const LOST_REASONS = [
  'Price too high',
  'Location not suitable',
  'Bought competitor project',
  'Budget / financing issue',
  'Not reachable',
  'Timeline mismatch',
  'Only exploring',
  'Chose different unit in our project',
]
```

---

---

# BUILD PHASES

> Read each phase completely before starting.
> Complete ALL checklist items before moving to next phase.
> After each phase — stop and show the user what was built.

---

## PHASE 0 — Project Setup
**Estimated time: 2–3 hours**  
**Goal: Working React app connected to InsForge, deployed on Cloudflare Pages**

### Steps

- [ ] Scaffold Vite + React project:
  ```bash
  npm create vite@latest ranav-crm -- --template react
  cd ranav-crm
  npm install
  ```

- [ ] Install dependencies:
  ```bash
  npm install @insforge/client
  npm install tailwindcss postcss autoprefixer
  npm install react-router-dom
  npm install lucide-react
  npm install react-hot-toast
  npm install date-fns
  npx tailwindcss init -p
  ```

- [ ] Install Cloudflare Wrangler CLI:
  ```bash
  npm install -g wrangler
  wrangler login
  ```

- [ ] Configure Vite for Cloudflare Workers deployment — update `vite.config.js`:
  ```js
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    base: '/',   // IMPORTANT — matches crm.anvayagrove.com
    build: {
      outDir: 'dist',
    }
  })
  ```

- [ ] Create `wrangler.toml` in project root:
  ```toml
  name = "ranav-crm"
  compatibility_date = "2024-01-01"
  pages_build_output_dir = "dist"

  [env.production]
  route = "crm.anvayagrove.com/*"
  ```

- [ ] Set environment variables in Cloudflare dashboard:
  - `VITE_INSFORGE_URL`
  - `VITE_INSFORGE_ANON_KEY`

- [ ] Configure Tailwind — add brand colors to `tailwind.config.js`:
  ```js
  colors: {
    brand: {
      blue:  '#1B3A6B',
      gold:  '#C9922A',
      green: '#1A7A3A',
      red:   '#AA2222',
    }
  }
  ```

- [ ] Create `src/insforge.js` — InsForge client singleton

- [ ] Create `.env.local` with InsForge URL and anon key

- [ ] Create `src/constants/` folder with all 5 constant files

- [ ] Set up React Router in `App.jsx` with placeholder routes

- [ ] Create GitHub repository and push initial commit

- [ ] Connect Cloudflare Pages to GitHub repo:
  ```bash
  wrangler pages project create ranav-crm
  ```
  Then in Cloudflare dashboard → Pages → Connect to Git → select repo

- [ ] Set build settings in Cloudflare Pages dashboard:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `/`

- [ ] Verify app loads at `crm.anvayagrove.com`

### Deliverable
Blank React app with Tailwind, routing, and InsForge connected. Loads at crm.anvayagrove.com.

---

## PHASE 1 — Authentication
**Estimated time: 1 day**  
**Goal: Login / logout working for all 5 roles**

### Components to Build

- [ ] `src/pages/Login.jsx`
  - Ranav Group logo + name at top
  - Email + password fields
  - "Sign In" button (brand blue)
  - Error message on failed login
  - Redirect to dashboard on success
  - Mobile responsive

- [ ] `src/hooks/useAuth.js`
  - `login(email, password)` — InsForge auth
  - `logout()` — clear session
  - `currentUser` — user object with role
  - `isLoading` state

- [ ] `src/components/layout/Layout.jsx`
  - Sidebar (desktop) + top bar
  - Responsive — sidebar collapses on mobile
  - Shows user name + role badge at bottom of sidebar
  - Logout button

- [ ] `src/components/layout/Sidebar.jsx`
  - Ranav CRM logo at top
  - Navigation links — based on role (agents don't see Reports, Agents pages)
  - Active link highlighted in brand blue
  - Mobile: bottom tab bar instead of sidebar

- [ ] `src/components/layout/TopBar.jsx`
  - Page title
  - User avatar + name
  - Notification bell (inactive in Phase 1)

- [ ] Route protection — redirect to login if not authenticated

### InsForge Tasks
- [ ] Enable Email Auth in InsForge dashboard
- [ ] Create test users for each role via InsForge dashboard:
  - admin@ranavgroup.com (role: admin)
  - md@ranavgroup.com (role: md)
  - director@ranavgroup.com (role: director)
  - agent1@ranavgroup.com (role: agent)
  - coordinator@ranavgroup.com (role: coordinator)
- [ ] Set up Row Level Security (RLS) on `leads` table:
  - Admin / MD / Director: SELECT all rows
  - Agent: SELECT only rows where assigned_to = auth.uid()

### Deliverable
Login screen works. Each role sees correct navigation. Protected routes redirect to login.

### Test Checklist
- [ ] Login works with all 5 test accounts
- [ ] Agent cannot see Reports or Agents pages
- [ ] Logout clears session and redirects to login
- [ ] Refresh maintains login state
- [ ] Mobile layout looks correct

---

## PHASE 2 — Lead List & Add Lead Form
**Estimated time: 1–2 days**  
**Goal: Agents can add leads. MD/Admin can see all leads.**

### Components to Build

- [ ] `src/pages/Leads.jsx`
  - Page header: "Leads" + "Add Lead" button (top right)
  - Filter bar: by stage, source, project, assigned agent (admin/md only)
  - Search bar: search by name or mobile
  - Lead table (desktop) / lead cards (mobile)
  - Empty state when no leads
  - Loading skeleton while fetching

- [ ] `src/components/leads/LeadForm.jsx`
  - Opens as a modal / slide-over panel
  - All lead fields from spec (full_name, mobile, email, source, property_interest, project_id, budget_range, tags, assigned_to, follow_up_at, notes)
  - **Duplicate check**: on mobile number blur — check InsForge if mobile exists — show warning
  - Assigned To: only shown to admin/md/director (auto-assigns to self for agents)
  - Tags: multi-select chips
  - Follow-up date: date + time picker
  - Save button (brand blue) + Cancel
  - Validation: full_name and mobile required

- [ ] `src/components/leads/LeadCard.jsx` (mobile view)
  - Name + mobile
  - Stage badge (color coded)
  - Source badge
  - Assigned agent name
  - Follow-up date (red if overdue)
  - Quick action buttons: Call (tel: link), WhatsApp (wa.me link), Edit

- [ ] `src/hooks/useLeads.js`
  - `fetchLeads(filters)` — role-aware (agents only get own leads)
  - `addLead(data)` — insert + log activity
  - `updateLead(id, data)` — update + log activity
  - `checkDuplicate(mobile)` — check if mobile exists

### InsForge Tasks
- [ ] Verify `leads` table exists with all columns
- [ ] Verify RLS policies are active
- [ ] Verify `projects` seed data exists

### Deliverable
Agents can add leads from their phone or desktop. Admin/MD sees all leads. Duplicate check works.

### Test Checklist
- [ ] Agent can add a lead — appears in their list
- [ ] Admin sees all leads from all agents
- [ ] Duplicate mobile number shows warning
- [ ] Required field validation works
- [ ] Filters work correctly
- [ ] Mobile card view looks correct
- [ ] Call button dials on mobile
- [ ] WhatsApp button opens WhatsApp chat

---

## PHASE 3 — Kanban Pipeline Board
**Estimated time: 1 day**  
**Goal: Visual pipeline — drag lead cards across stages**

### Components to Build

- [ ] `src/components/leads/KanbanBoard.jsx`
  - Horizontal scroll board — one column per stage
  - Column header: stage name + count badge
  - Each column shows lead cards
  - Drag and drop between columns (use `@dnd-kit/core`)
  - Install: `npm install @dnd-kit/core @dnd-kit/sortable`
  - On drop: update pipeline_stage in InsForge
  - If dropping to 'lost' stage: show Lost Reason modal before saving
  - Board switches between Kanban and List view (toggle button)

- [ ] `src/components/leads/KanbanColumn.jsx`
  - Column header with stage color
  - Scrollable card list
  - "Add Lead" shortcut at bottom of New Lead column

- [ ] Update `src/pages/Leads.jsx`
  - Toggle between List View and Kanban View
  - Kanban is default view

### InsForge Tasks
- [ ] No new tables needed

### Deliverable
Visual Kanban board. Drag a lead card to move it to next stage. Lost reason modal appears when marking lost.

### Test Checklist
- [ ] All 7 columns show correctly
- [ ] Drag and drop works on desktop
- [ ] Stage updates save to InsForge
- [ ] Lost reason modal appears on drag to Lost
- [ ] Lead count per column is accurate
- [ ] Mobile: horizontal scroll works

---

## PHASE 4 — Lead Detail Page & Notes
**Estimated time: 1 day**  
**Goal: Full lead history, notes, stage updates, follow-up scheduling**

### Components to Build

- [ ] `src/pages/LeadDetailPage.jsx`
  - Top section: lead info (name, mobile, email, source, tags, budget)
  - Middle section: Activity Timeline (all notes + stage changes in chronological order)
  - Right panel (desktop) / bottom section (mobile): Quick actions
  - Stage update dropdown with confirmation
  - Follow-up date editor

- [ ] `src/components/leads/LeadDetail.jsx`
  - Activity timeline component
  - Each entry: icon + text + agent name + timestamp
  - Stage change entries shown differently from notes
  - Add Note text area at bottom — submit adds to `lead_notes` table

- [ ] Overdue follow-up banner
  - Red banner at top if follow_up_at is in the past
  - "Update Follow-up" button

- [ ] Quick action buttons (always visible):
  - 📞 Call — opens tel: link
  - 💬 WhatsApp — opens wa.me link with pre-filled message
  - ✏️ Edit Lead — opens LeadForm in edit mode
  - 🗑️ Archive — soft delete (admin/md only)

### InsForge Tasks
- [ ] Verify `lead_notes` table and RLS policies
- [ ] Verify `activity_log` table

### Deliverable
Full lead detail page. Agent can add notes. Timeline shows full history. Follow-up clearly visible.

### Test Checklist
- [ ] Notes save and appear in timeline
- [ ] Stage change logged in timeline
- [ ] Overdue banner shows for past follow-ups
- [ ] Call and WhatsApp buttons work on mobile
- [ ] Agent cannot see archived leads
- [ ] Admin can archive a lead

---

## PHASE 5 — Dashboard
**Estimated time: 1 day**  
**Goal: MD/Admin morning dashboard. Agent personal dashboard.**

### Components to Build

- [ ] `src/pages/Dashboard.jsx`
  - Role-aware: MD/Admin/Director see full dashboard, Agent sees personal dashboard

- [ ] **MD/Admin Dashboard widgets:**

  - [ ] Summary Cards Row (4 cards):
    - New leads today
    - Follow-ups due today (red if any overdue)
    - Site visits today
    - Bookings this month

  - [ ] Pipeline Funnel
    - Horizontal bar chart — leads per stage
    - Use `recharts` library: `npm install recharts`

  - [ ] Leads by Source
    - Pie chart — Website / Instagram / 99acres / etc

  - [ ] Overdue Follow-ups Table
    - Lead name | Agent | Days overdue | Mobile (call button)
    - Sorted by most overdue first

  - [ ] Recent Activity Feed
    - Last 20 actions from activity_log
    - "Agent X moved Lead Y to Negotiation — 2 hours ago"

- [ ] **Agent Personal Dashboard widgets:**
  - [ ] My follow-ups today (list with call/WhatsApp buttons)
  - [ ] My pipeline summary (count per stage)
  - [ ] My leads this month vs last month

### InsForge Tasks
- [ ] Create database views or queries for dashboard aggregations

### Deliverable
MD opens laptop — sees full business picture instantly. Agent opens app — sees today's tasks.

### Test Checklist
- [ ] MD sees all agents' data
- [ ] Agent only sees own data
- [ ] Overdue follow-ups show correct count
- [ ] Charts render correctly
- [ ] Summary numbers are accurate

---

## PHASE 6 — Agent Management (Admin/MD only)
**Estimated time: 0.5 days**  
**Goal: Admin can add, edit, deactivate agents**

### Components to Build

- [ ] `src/pages/Agents.jsx`
  - Table of all agents with: Name, Mobile, Email, Role, Status, Leads Assigned
  - "Add Agent" button — opens form modal
  - Deactivate toggle (soft disable — cannot delete)
  - Only visible to Admin/MD/Director

- [ ] Add Agent Form
  - Full name, email, mobile, role dropdown
  - On save: create InsForge auth user + user_profiles record
  - Temporary password sent to agent's email

### InsForge Tasks
- [ ] Use InsForge Admin API to create auth users programmatically

### Deliverable
Admin can onboard all 15+ agents without touching InsForge dashboard.

### Test Checklist
- [ ] New agent can login with created credentials
- [ ] Deactivated agent cannot login
- [ ] Agent count shows correctly on lead assignment dropdown

---

## PHASE 7 — Polish, Mobile UX & Deployment
**Estimated time: 1 day**  
**Goal: Production-ready. Looks professional on all devices.**

### Tasks

- [ ] Mobile responsiveness audit — test every page on 375px width
- [ ] Add loading states to all data fetches (skeleton loaders)
- [ ] Add error boundaries — app never crashes with blank screen
- [ ] Add empty states to all lists (illustrated empty state, not just blank)
- [ ] Toast notifications for all actions (success/error) using `react-hot-toast`
- [ ] Confirm dialogs before destructive actions (archive, stage change to Lost)
- [ ] PWA setup — add to home screen on mobile (manifest.json + service worker)
- [ ] Deploy to Cloudflare Workers:
  ```bash
  npm run build
  wrangler pages deploy dist
  ```
- [ ] Verify live at `crm.anvayagrove.com`
- [ ] Environment variables confirmed in Cloudflare dashboard
- [ ] Final performance check — Lighthouse score > 80
- [ ] Create agent onboarding guide (1-page PDF of how to use the app)

### Deliverable
Production-ready Mini CRM. All 15+ agents onboarded. crm.ranavgroup.com live.

---

# COMPLETION SUMMARY

When all 7 phases are done, the Mini CRM will have:

| Feature | Status |
|---|---|
| Login for all 5 roles | ✅ Phase 1 |
| Add / edit leads | ✅ Phase 2 |
| Duplicate mobile detection | ✅ Phase 2 |
| Kanban pipeline board | ✅ Phase 3 |
| Lead detail + notes timeline | ✅ Phase 4 |
| MD morning dashboard | ✅ Phase 5 |
| Agent daily task dashboard | ✅ Phase 5 |
| Agent management | ✅ Phase 6 |
| Mobile optimised PWA | ✅ Phase 7 |
| Live at crm.anvayagrove.com | ✅ Phase 7 |

---

# WHAT COMES AFTER MINI CRM

These modules are planned for the full CRM build:

| Module | Planned Phase |
|---|---|
| Property inventory map (plots + apartments) | Full CRM Phase 2 |
| Site visit management + WhatsApp reminders | Full CRM Phase 2 |
| Client 360 profile + document management | Full CRM Phase 2 |
| Negotiation log + discount approval | Full CRM Phase 2 |
| Payment milestone tracker | Full CRM Phase 3 |
| Channel partner module | Full CRM Phase 2 |
| Advanced reports + forecasting | Full CRM Phase 3 |
| Automation + lead nurturing | Full CRM Phase 3 |
| Audit log + data masking | Full CRM Phase 3 |

---

# RULES FOR CLAUDE CODE

> Follow these rules on every task in this project:

1. **Always read CLAUDE.md first** before writing any code
2. **One phase at a time** — never build Phase 3 components during Phase 1
3. **Mobile first** — every component must work on 375px width
4. **Brand colors only** — use the defined CSS variables, never random colors
5. **InsForge via MCP** — always use InsForge MCP tools to create tables, never raw SQL unless specified
6. **No hardcoded data** — all data from InsForge, never mock data in production components
7. **Role checks everywhere** — every page and component must check user role before rendering
8. **Soft delete only** — never use DELETE on leads, notes, or users — set is_deleted = true
9. **Log everything** — every lead create/update/delete must write to activity_log
10. **Ask before moving phases** — always confirm with the user before starting the next phase
11. **Test checklist** — run through the test checklist at the end of each phase and report results
12. **Commit after each phase** — git commit with clear message after phase completion

---

*Document version: 1.0 — March 2026*  
*Project: Ranav Group Mini CRM*  
*Prepared for use with Claude Code + InsForge + Cloudflare Pages*
