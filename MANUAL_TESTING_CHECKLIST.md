# Manual Testing Checklist - ProjectOps

**Purpose:** Quick manual verification of ProjectOps functionality  
**Time Required:** 2-4 hours for complete checklist  
**Prerequisites:** Backend and frontend servers running, database connected  

---

## PRE-TEST SETUP

### 1. Verify Servers Running

```powershell
# Check backend (should be on port 5000)
curl http://localhost:5000/api/health

# Check frontend (should be on port 5173)
# Open browser to http://localhost:5173
```

### 2. Prepare Test Data

Create test accounts:
- Owner Account: `test-owner@example.com` / `TestPass123`
- Developer Account: `test-dev@example.com` / `TestPass123`
- Viewer Account: `test-viewer@example.com` / `TestPass123`

---

## BATCH A: AUTHENTICATION & SESSION (30 minutes)

### A1. Registration
- [ ] Navigate to http://localhost:5173/register
- [ ] Try empty form → Should show validation errors
- [ ] Enter name: "Test Owner"
- [ ] Enter email: "test-owner@example.com"
- [ ] Enter password: "TestPass123"
- [ ] Enter confirm password: "TestPass123"
- [ ] Click "Create Account"
- [ ] **PASS:** Redirects to /dashboard
- [ ] **PASS:** Shows user name in UI
- [ ] **FAIL:** Error message displayed
- [ ] **Screenshot:** Registration result

### A2. Logout
- [ ] Click logout button (sidebar footer)
- [ ] **PASS:** Redirects to /login
- [ ] **PASS:** Can't access /dashboard (redirects to login)
- [ ] **Screenshot:** After logout

### A3. Login
- [ ] Navigate to /login
- [ ] Enter email: "test-owner@example.com"
- [ ] Enter password: "TestPass123"
- [ ] Click "Sign In"
- [ ] **PASS:** Redirects to /dashboard
- [ ] **PASS:** Session persists after page refresh
- [ ] **Screenshot:** Successful login

### A4. Forgot Password
- [ ] Click "Forgot password" link
- [ ] Enter email
- [ ] Submit form
- [ ] **RESULT:** ________________
- [ ] **Screenshot:** Forgot password page

---

## BATCH B: DASHBOARD (20 minutes)

### B1. Dashboard Statistics
- [ ] Navigate to /dashboard
- [ ] Check "Projects" card → Note count: _____
- [ ] Check "Completed" card → Note count: _____
- [ ] Check "Pending" card → Note count: _____
- [ ] Check "Blocked" card → Note count: _____
- [ ] **Screenshot:** Dashboard overview

### B2. Delivery Progress
- [ ] Find "Delivery progress" card
- [ ] Note percentage: _____% 
- [ ] Note progress bar fill
- [ ] If 0 tasks exist:
  - [ ] Does it show 100%? (DEFECT-001)
  - [ ] Or does it show 0% correctly?
- [ ] **Screenshot:** Progress card

### B3. Project Health
- [ ] Find "Project health" section
- [ ] Count projects shown: _____
- [ ] For each project note:
  - Health score: _____
  - Status badge: _____
- [ ] If project has 0 tasks:
  - [ ] Does it show 100/HEALTHY? (DEFECT-002)
  - [ ] Or does it show N/A correctly?
- [ ] **Screenshot:** Health section

### B4. Activity Feed
- [ ] Find "Recent activity" section
- [ ] Check if activities shown: Yes / No
- [ ] If no: What message displays? ________________
- [ ] **Screenshot:** Activity feed

---

## BATCH C: PROJECT MANAGEMENT (40 minutes)

### C1. Navigate to Projects
- [ ] Click "Projects" in navigation
- [ ] **PASS:** Loads /projects page
- [ ] **Screenshot:** Projects list

### C2. Create Project
- [ ] Click "New Project" button (or similar)
- [ ] **IF NO BUTTON:** Document location checked: ________________
- [ ] Fill name: "Test Project Alpha"
- [ ] Fill description: "Manual test project"
- [ ] Fill goal: "Test project functionality"
- [ ] Select status: "ACTIVE"
- [ ] Click Create/Save
- [ ] **PASS:** Project appears in list
- [ ] **PASS:** Can navigate to project
- [ ] **Screenshot:** Project creation form
- [ ] **Screenshot:** Project in list

### C3. Project Detail Tabs
Navigate to the created project, test each tab:

**Overview Tab**
- [ ] Click "Overview" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Overview

**AI Command Tab**
- [ ] Click "AI Command" tab
- [ ] **Result:** ________________
- [ ] Check if controls visible
- [ ] **Screenshot:** AI Command

**Work Items Tab**
- [ ] Click "Work items" tab
- [ ] **Result:** ________________
- [ ] Check kanban/list toggle
- [ ] **Screenshot:** Work items

**Dependencies Tab**
- [ ] Click "Dependencies" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Dependencies

**Assignments Tab**
- [ ] Click "Assignments" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Assignments

**Timeline Tab**
- [ ] Click "Timeline" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Timeline

**Milestones Tab**
- [ ] Click "Milestones" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Milestones

**Repository Tab**
- [ ] Click "Repository" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Repository

**Activity Tab**
- [ ] Click "Activity" tab
- [ ] **Result:** ________________
- [ ] **Screenshot:** Activity

### C4. Project Search
- [ ] Use search box in header
- [ ] Type project name: "Test Project Alpha"
- [ ] **PASS:** Project appears in results
- [ ] **PASS:** Click navigates to project
- [ ] **Screenshot:** Search results

---

## BATCH D: AI PLANNER (30 minutes)

### D1. Standalone AI Planner
- [ ] Navigate to /ai/planner
- [ ] Fill "Project Goal": "Build a todo app"
- [ ] Fill "Details": "Simple task management"
- [ ] Fill "Deadline": (pick future date)
- [ ] Fill "Team Size": 3
- [ ] Fill "Tech Stack": "React, Node.js"
- [ ] Click "Generate Plan"
- [ ] **PASS:** Plan appears
- [ ] **PASS:** Shows "Deterministic Planner" note
- [ ] Note task count: _____
- [ ] Note dependency count: _____
- [ ] Note milestone count: _____
- [ ] **Screenshot:** Generated plan

### D2. Apply Plan to Project
- [ ] Select project from dropdown
- [ ] Click "Apply Plan" (or "Review & Apply")
- [ ] **PASS:** Success message
- [ ] **FAIL:** Error: ________________
- [ ] Navigate to project
- [ ] **PASS:** Tasks visible in work items
- [ ] **Screenshot:** Applied plan

### D3. Verify Dependency Graph
- [ ] Go to project Dependencies tab
- [ ] Switch to Graph View
- [ ] **PASS:** Graph displays
- [ ] **PASS:** Shows task nodes
- [ ] **PASS:** Shows dependency edges
- [ ] **Screenshot:** Dependency graph

---

## BATCH E: TASK MANAGEMENT (40 minutes)

### E1. Create Task Manually
- [ ] Navigate to project Work Items
- [ ] Click "Add Task" (or "New Task")
- [ ] Fill title: "Manual Test Task"
- [ ] Fill description: "Testing task creation"
- [ ] Select status: "TODO"
- [ ] Select priority: "MEDIUM"
- [ ] Click Save
- [ ] **PASS:** Task appears
- [ ] **Screenshot:** Task creation

### E2. Edit Task
- [ ] Click task to open
- [ ] Change status to "IN_PROGRESS"
- [ ] Change priority to "HIGH"
- [ ] Add deadline (future date)
- [ ] Click Save
- [ ] **PASS:** Changes persist
- [ ] **PASS:** Visible after refresh
- [ ] **Screenshot:** Edited task

### E3. Assign Task
- [ ] Open task
- [ ] Look for assignment controls
- [ ] Try to assign to yourself
- [ ] **PASS:** Assignment works
- [ ] **FAIL:** No assignment UI: ________________
- [ ] **Screenshot:** Assignment controls

### E4. View Toggle (Board/List)
- [ ] Find Board/List toggle
- [ ] Click to switch views
- [ ] **PASS:** Both views work
- [ ] **Screenshot:** Board view
- [ ] **Screenshot:** List view

---

## BATCH F: RISK & RECOVERY (30 minutes)

### F1. Risk Detection
- [ ] Navigate to /risks OR project AI Command
- [ ] Look for risk detection controls
- [ ] Create overdue task (past deadline) if needed
- [ ] Click "Refresh Analysis" or similar
- [ ] **PASS:** Risks display
- [ ] **FAIL:** No risks shown: ________________
- [ ] **Screenshot:** Risk display

### F2. Impact Analysis
- [ ] In AI Command Center
- [ ] Find "Simulate Delay" section
- [ ] Select a task
- [ ] Enter delay days: 2
- [ ] Click "Analyze Impact"
- [ ] **PASS:** Impact results show
- [ ] **PASS:** Affected tasks listed
- [ ] **Screenshot:** Impact analysis

### F3. Recovery Proposal
- [ ] After impact analysis
- [ ] Look for "Generate Recovery" button
- [ ] Click to generate recovery
- [ ] **PASS:** Proposal appears
- [ ] **PASS:** Shows reschedule actions
- [ ] **Screenshot:** Recovery proposal

### F4. Review & Apply Recovery
- [ ] Find "Review" or "Approve" button
- [ ] Click review
- [ ] Check proposal details
- [ ] Click "Apply" or "Approve & Apply"
- [ ] **PASS:** Applied successfully
- [ ] **PASS:** Task deadlines updated
- [ ] **Screenshot:** Applied recovery

---

## BATCH G: TEAM & SKILLS (30 minutes)

### G1. Team Directory
- [ ] Navigate to /team
- [ ] **PASS:** Team members listed
- [ ] Note count: _____
- [ ] **Screenshot:** Team directory

### G2. Skills Management
- [ ] Navigate to /skills
- [ ] **PASS:** Skills interface loads
- [ ] Try to add skill
- [ ] **Result:** ________________
- [ ] **Screenshot:** Skills page

### G3. Skill Proficiency
- [ ] Check if proficiency levels shown
- [ ] Try to set proficiency
- [ ] **Result:** ________________
- [ ] **Screenshot:** Proficiency controls

---

## BATCH H: PROFILE & SETTINGS (20 minutes)

### H1. Profile Page
- [ ] Navigate to /profile
- [ ] Check editable fields:
  - [ ] Name
  - [ ] Bio
  - [ ] Skills
  - [ ] Availability
  - [ ] Weekly capacity
- [ ] Try to edit name
- [ ] Click "Save Profile"
- [ ] **PASS:** Changes saved
- [ ] **Screenshot:** Profile page

### H2. Profile Photo
- [ ] Find photo upload control
- [ ] Try to upload image
- [ ] **PASS:** Upload works
- [ ] **FAIL:** Upload broken: ________________
- [ ] **Screenshot:** Photo upload

### H3. Settings
- [ ] Navigate to /settings
- [ ] Check what's available
- [ ] Note "coming soon" items: ________________
- [ ] **Screenshot:** Settings page

---

## BATCH I: ADMINISTRATION (20 minutes)

### I1. User Management
- [ ] Navigate to /admin/users
- [ ] **IF NOT ACCESSIBLE:** Note restriction: ________________
- [ ] **PASS:** User list displays
- [ ] Note user count: _____
- [ ] **Screenshot:** Admin page

### I2. Role Management
- [ ] Try to change user role
- [ ] **Result:** ________________
- [ ] **Screenshot:** Role change UI

---

## BATCH J: NAVIGATION & SHELL (20 minutes)

### J1. Sidebar Collapse
- [ ] Click collapse button in icon rail
- [ ] **PASS:** Sidebar collapses
- [ ] **PASS:** Icon-only view shown
- [ ] Click again
- [ ] **PASS:** Sidebar expands
- [ ] **Screenshot:** Collapsed state
- [ ] **Screenshot:** Expanded state

### J2. AI Assistant Panel
- [ ] Click "AI assistant" toggle in header
- [ ] **PASS:** Right panel opens
- [ ] **PASS:** Shows project context
- [ ] Click again
- [ ] **PASS:** Panel closes
- [ ] **Screenshot:** AI panel open

### J3. Mobile Navigation
- [ ] Resize browser to 390px width
- [ ] **PASS:** Hamburger menu appears
- [ ] Click hamburger
- [ ] **PASS:** Mobile drawer opens
- [ ] **Screenshot:** Mobile layout

---

## SUMMARY RESULTS

### Total Checks: ___ / ___

**Passed:** _____  
**Failed:** _____  
**Not Applicable:** _____  

### Critical Defects Found

1. ______________________________
2. ______________________________
3. ______________________________

### Minor Issues Found

1. ______________________________
2. ______________________________
3. ______________________________

### Missing Features

1. ______________________________
2. ______________________________
3. ______________________________

### Overall Assessment

**Can Demo?** Yes / No  
**Production Ready?** Yes / No  
**Major Blockers:** ______________________________

---

## DEFECT TEMPLATE

For each defect found, document:

**DEFECT ID:** DEF-###  
**Title:** ______________________________  
**Severity:** Critical / High / Medium / Low  
**Location:** Page/Component  
**Steps to Reproduce:**  
1. ______________________________
2. ______________________________
3. ______________________________

**Expected Result:** ______________________________  
**Actual Result:** ______________________________  
**Screenshot:** (attach)  
**Impact:** ______________________________  

---

## NEXT STEPS AFTER TESTING

1. **Compile all screenshots** into evidence folder
2. **Document all defects** using template above
3. **Prioritize issues** (P0/P1/P2/P3)
4. **Create bug fix tickets** for development
5. **Retest after fixes** to verify resolution

---

**Tester:** ______________________________  
**Date:** ______________________________  
**Duration:** ______ hours  
**Environment:** Development (localhost)  

