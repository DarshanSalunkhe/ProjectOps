# ProjectOps - Pre-Merge Verification Checklist

## ⚠️ IMPORTANT: DO NOT MERGE WITHOUT VERIFICATION

This document outlines critical tests that MUST pass before merging the 56 modified files into the main branch.

---

## 1. Backend Dependencies Verification

### Issue
Build log shows UNMET DEPENDENCY warnings:
```
UNMET DEPENDENCY bcrypt@^5.1.1
UNMET DEPENDENCY cors@^2.8.5
UNMET DEPENDENCY dotenv@^16.4.5
```

### Action Required
```bash
cd backend
npm install
npm list bcrypt cors dotenv express pg jsonwebtoken
```

### Pass Criteria
- ✅ All packages installed without errors
- ✅ No missing dependencies
- ✅ Backend starts without import errors

**Status**: ⚠️ UNVERIFIED - Needs manual check

---

## 2. Backend Startup Test

### Test
```bash
cd backend
npm run dev
```

### Pass Criteria
- ✅ Server starts on port 5000
- ✅ Database connection succeeds
- ✅ All routes registered
- ✅ No import/syntax errors
- ✅ Health endpoint responds: `curl http://localhost:5000/api/health`

**Status**: ⚠️ UNVERIFIED

---

## 3. Frontend Build & Runtime Test

### Test
```bash
cd frontend
npm run dev
```

### Pass Criteria
- ✅ Dev server starts on port 5173
- ✅ No runtime errors in browser console
- ✅ Pages load without blank screens
- ✅ Logos display correctly
- ✅ Navigation works

**Status**: ⚠️ UNVERIFIED

---

## 4. Authentication Regression Test

### Critical: Ensure existing auth still works

#### Google OAuth
**Test Steps:**
1. Click "Continue with Google" on login page
2. Complete Google auth flow
3. Verify redirect back to dashboard
4. Check user session persists

**Pass Criteria:**
- ✅ Google OAuth flow completes
- ✅ User session created
- ✅ JWT token stored
- ✅ Dashboard accessible

**Status**: ⚠️ UNVERIFIED

#### Email/Password Login
**Test Steps:**
1. Create new account via register
2. Logout
3. Login with email/password
4. Verify dashboard access

**Pass Criteria:**
- ✅ Registration works
- ✅ Login works
- ✅ Session persists

**Status**: ⚠️ UNVERIFIED

---

## 5. Project Membership Regression Test

### Critical: Ensure RBAC still works

**Test Steps:**
1. User A creates project (becomes OWNER)
2. User A invites User B as DEVELOPER
3. User B accepts invitation
4. Verify User B can access project
5. Verify User B cannot delete project (OWNER only)
6. Verify User A can manage members

**Pass Criteria:**
- ✅ Project creation works
- ✅ Invitations send
- ✅ Role permissions enforced
- ✅ Member list displays correctly

**Status**: ⚠️ UNVERIFIED

---

## 6. Core Demo Flow - END-TO-END TEST

### **THIS IS THE CRITICAL TEST**

If this passes, the core value proposition works.

### 6.1 Create Project
**Test:**
```
1. Login
2. Navigate to Projects
3. Click "Create Project"
4. Enter: Name, Description, Goal, Deadline
5. Click "Create Project"
```

**Pass Criteria:**
- ✅ Project created in database
- ✅ User is OWNER
- ✅ Redirected to project detail page

**Status**: ⚠️ UNVERIFIED

---

### 6.2 Generate AI Plan
**Test:**
```
1. Go to project → AI Command tab
2. Click "Generate Project Plan"
3. Enter:
   - Goal: "Build an e-commerce platform"
   - Team Size: 4
   - Deadline: 60 days from now
4. Click "Generate Plan"
5. Wait for plan generation
6. Click "Apply Plan to Project"
7. Reload page
```

**Pass Criteria:**
- ✅ Plan generates in <5 seconds
- ✅ Shows 15-25 tasks
- ✅ Shows dependencies
- ✅ Shows milestones
- ✅ "Apply" succeeds without errors
- ✅ After reload, tasks appear in Tasks tab
- ✅ Dependencies stored in database
- ✅ Transaction rollback works on error

**Database Verification:**
```sql
-- Check tasks were created
SELECT COUNT(*) FROM tasks WHERE project_id = [project_id];

-- Check dependencies were created
SELECT COUNT(*) FROM task_dependencies 
WHERE task_id IN (SELECT id FROM tasks WHERE project_id = [project_id]);

-- Check milestones were created
SELECT COUNT(*) FROM milestones WHERE project_id = [project_id];
```

**Expected:** 15+ tasks, 10+ dependencies, 3+ milestones

**Status**: ⚠️ UNVERIFIED

---

### 6.3 View Dependency Graph
**Test:**
```
1. Go to Dependencies tab
2. Click "Graph View"
3. Observe visualization
```

**Pass Criteria:**
- ✅ Graph renders without errors
- ✅ Task nodes visible
- ✅ Dependency arrows visible
- ✅ Can switch between Graph/List view
- ✅ No console errors

**Status**: ⚠️ UNVERIFIED

---

### 6.4 Get Assignment Recommendations
**Test:**
```
1. Ensure at least one user has skills in profile
2. Go to AI Command tab
3. Click "Get Assignment Recommendations"
4. Wait for recommendations
```

**Pass Criteria:**
- ✅ Recommendations load
- ✅ Shows match scores
- ✅ Shows explanations
- ✅ API returns 200 status
- ✅ No server errors in backend log

**API Test:**
```bash
# Get auth token first
TOKEN="your_jwt_token"

# Test skill matching endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/tasks/1/skill-matches
```

**Expected:** Array of candidates with match_score, explanation

**Status**: ⚠️ UNVERIFIED

---

### 6.5 Detect Risks
**Test:**
```
1. In AI Command tab, check "Project Health" section
2. Check "Active Risks" section
3. Click "Refresh Analysis"
```

**Pass Criteria:**
- ✅ Health score displays (0-100)
- ✅ Health status shows (HEALTHY/AT_RISK/CRITICAL)
- ✅ Risks list populated
- ✅ Each risk has severity, message, recommendation
- ✅ API responds correctly

**API Test:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/intelligence/health/[project_id]
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "health": {
      "score": 85,
      "status": "HEALTHY"
    },
    "stats": {
      "totalTasks": 20,
      "completed": 0,
      "inProgress": 0,
      "blocked": 0,
      "overdue": 0
    },
    "risks": []
  }
}
```

**Status**: ⚠️ UNVERIFIED

---

### 6.6 Simulate Delay → Analyze Impact
**Test:**
```
1. In AI Command, scroll to "Autonomous Demo"
2. Select a task from dropdown (pick one with dependencies)
3. System automatically runs impact analysis
4. Observe results
```

**Pass Criteria:**
- ✅ Impact analysis completes
- ✅ Shows directly affected tasks
- ✅ Shows indirectly affected tasks (if any)
- ✅ Shows overall impact level
- ✅ Provides recommendation
- ✅ No errors in console/backend

**API Test:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delayDays": 2}' \
  http://localhost:5000/api/intelligence/impact/[task_id]
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "sourceTask": { "id": 1, "title": "...", "delayDays": 2 },
    "directlyAffected": [...],
    "indirectlyAffected": [...],
    "totalAffected": 3,
    "overallImpact": "HIGH",
    "recommendation": "..."
  }
}
```

**Status**: ⚠️ UNVERIFIED

---

### 6.7 Generate Recovery Plan
**Test:**
```
1. After impact analysis, system automatically generates replan
2. Review "Autonomous Recovery Plan" section
3. Check recommendations
```

**Pass Criteria:**
- ✅ Replanning completes
- ✅ Shows 1-5 recommendations
- ✅ Each has type, priority, action, target, benefit
- ✅ Shows estimated impact
- ✅ Shows confidence level
- ✅ No errors

**API Test:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"problem": {"type": "TASK_DELAY", "taskId": 1, "delayDays": 2}}' \
  http://localhost:5000/api/intelligence/replan/[project_id]
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "projectId": 1,
    "problem": {...},
    "recommendations": [
      {
        "type": "REASSIGN",
        "priority": "HIGH",
        "action": "...",
        "target": {...},
        "expectedBenefit": "..."
      }
    ],
    "estimatedImpact": {...}
  }
}
```

**Status**: ⚠️ UNVERIFIED

---

## 7. Data Persistence Test

### Critical: Verify data is actually saved

**Test Steps:**
1. Complete full demo flow above
2. Stop backend and frontend
3. Restart both servers
4. Login again
5. Navigate to same project

**Pass Criteria:**
- ✅ Project still exists
- ✅ All tasks still present
- ✅ Dependencies preserved
- ✅ Milestones intact
- ✅ No data loss

**Status**: ⚠️ UNVERIFIED

---

## 8. GitHub Integration Reality Check

### What It Actually Does
- ✅ Stores repository URL in database
- ✅ Validates URL format
- ✅ Displays linked repository

### What It Does NOT Do
- ❌ Fetch commits
- ❌ Fetch pull requests
- ❌ Fetch issues
- ❌ Sync contributor activity
- ❌ Webhooks
- ❌ Write operations

### Test
```
1. Go to Repository tab
2. Click "Link Repository"
3. Enter: https://github.com/username/repo
4. Click Save
5. Reload page
```

**Pass Criteria:**
- ✅ URL saved to database
- ✅ URL displayed correctly
- ✅ Can edit/update URL

**Status**: ⚠️ UNVERIFIED

**Note:** This is basic URL storage, not full GitHub integration.

---

## 9. Error Handling Test

### Test Failure Scenarios

**Test 1: Invalid Plan Generation**
```
1. Try generating plan with empty goal
2. Try generating plan with invalid team size (0 or negative)
```

**Pass Criteria:**
- ✅ Validation error shown
- ✅ No server crash
- ✅ User can retry

**Test 2: Invalid Task ID**
```
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/intelligence/impact/99999
```

**Pass Criteria:**
- ✅ Returns 404 or appropriate error
- ✅ No server crash

**Test 3: Database Transaction Failure**
```
1. Start applying plan
2. Kill database connection mid-transaction
```

**Pass Criteria:**
- ✅ Transaction rolls back
- ✅ No partial data left
- ✅ User sees error message

**Status**: ⚠️ UNVERIFIED

---

## 10. Browser Console Check

### Test
Open browser console on each page and check for errors

**Pages to Check:**
- Login
- Dashboard
- Projects list
- Project detail
- AI Command tab
- Dependencies tab
- Tasks tab
- Team tab

**Pass Criteria:**
- ✅ No red errors in console
- ✅ Warnings are acceptable if non-critical
- ✅ Network tab shows successful API calls
- ✅ No 500 errors

**Status**: ⚠️ UNVERIFIED

---

## 11. Mobile Responsiveness Test

### Test
Resize browser to mobile width (375px)

**Pass Criteria:**
- ✅ Navigation drawer works
- ✅ Forms are usable
- ✅ Dependency graph adapts or scrolls
- ✅ No horizontal overflow
- ✅ Logos display correctly

**Status**: ⚠️ UNVERIFIED

---

## 12. Performance Test

### Test Metrics

**Page Load Times:**
- Dashboard: < 2 seconds
- Project Detail: < 2 seconds
- AI Command: < 2 seconds

**API Response Times:**
- Generate Plan: < 5 seconds
- Detect Risks: < 1 second
- Impact Analysis: < 2 seconds
- Replanning: < 3 seconds

**Pass Criteria:**
- ✅ All within acceptable limits
- ✅ No timeouts
- ✅ Smooth user experience

**Status**: ⚠️ UNVERIFIED

---

## Summary Verification Status

### Critical Tests (Must Pass)
| Test | Status | Priority |
|------|--------|----------|
| Backend Dependencies | ⚠️ UNVERIFIED | CRITICAL |
| Backend Startup | ⚠️ UNVERIFIED | CRITICAL |
| Frontend Runtime | ⚠️ UNVERIFIED | CRITICAL |
| Google Auth | ⚠️ UNVERIFIED | CRITICAL |
| Email/Password Login | ⚠️ UNVERIFIED | CRITICAL |
| Create Project | ⚠️ UNVERIFIED | CRITICAL |
| Generate AI Plan | ⚠️ UNVERIFIED | CRITICAL |
| Apply Plan (DB Save) | ⚠️ UNVERIFIED | CRITICAL |
| View Dependencies | ⚠️ UNVERIFIED | HIGH |
| Get Assignments | ⚠️ UNVERIFIED | HIGH |
| Detect Risks | ⚠️ UNVERIFIED | HIGH |
| Analyze Impact | ⚠️ UNVERIFIED | HIGH |
| Generate Replan | ⚠️ UNVERIFIED | HIGH |
| Data Persistence | ⚠️ UNVERIFIED | CRITICAL |

### Implementation Claim vs Reality

**Claimed:** "DEMO READY ✅"  
**Reality:** "IMPLEMENTATION COMPLETE, VERIFICATION PENDING ⚠️"

**Claimed:** "All features working end-to-end"  
**Reality:** "Features implemented, manual testing required"

**Claimed:** "Production-ready"  
**Reality:** "Demo-ready once verified"

---

## Recommendation

### DO NOT MERGE until:
1. ✅ All CRITICAL tests pass
2. ✅ Core demo flow works end-to-end
3. ✅ Data persists across restarts
4. ✅ No regression in existing features
5. ✅ Team reviews 56 modified files

### Suggested Testing Order:
1. **First:** Backend dependencies + startup
2. **Second:** Frontend build + runtime
3. **Third:** Authentication (both methods)
4. **Fourth:** Core demo flow (Section 6)
5. **Fifth:** Error handling
6. **Last:** Polish (mobile, performance)

### If Tests Fail:
- Document the failure
- Fix the issue
- Re-run full verification
- Do not skip steps

---

## Honest Assessment

### What Was Actually Accomplished:
- ✅ 56 files modified with intelligence features
- ✅ Backend services created (6 agent services)
- ✅ Frontend components created (AICommandCenter, DependencyGraph)
- ✅ API routes registered (8 intelligence endpoints)
- ✅ Professional branding integrated
- ✅ Documentation written

### What Is Still Unknown:
- ❓ Do all dependencies actually work?
- ❓ Does the backend start without errors?
- ❓ Does the AI planner actually save to database?
- ❓ Do the agents coordinate correctly?
- ❓ Does data persist?
- ❓ Does the full demo flow complete?
- ❓ Are there any runtime errors?

### What Needs to Happen Next:
1. Run this verification checklist
2. Document results (pass/fail for each test)
3. Fix any failures
4. Get team review of changes
5. Only then merge to main

---

**Current Status:** IMPLEMENTATION COMPLETE, NEEDS VERIFICATION  
**Merge Status:** ⚠️ DO NOT MERGE YET  
**Demo Status:** PENDING VERIFICATION  

Last Updated: Implementation complete, verification pending
