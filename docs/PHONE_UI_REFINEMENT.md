# Phone UI refinement

The phone interface now uses the available screen width, with bottom navigation for Home, Projects, Tasks, Team, and More. Project sections are available from a labeled selector. Search has its own row in portrait orientation, while landscape uses a compact header.

Long titles, descriptions, names, and email addresses wrap. Cards, task columns, profile fields, AI summaries, and task skill inputs stack at narrow widths. Dependency maps retain a dedicated scrollable region. Dialogs use native modal behavior with bounded viewport height and scrollable contents. Buttons and form fields have larger touch targets. Safe-area spacing and dynamic viewport sizing support mobile browser chrome.

## Verification

- Production frontend build passed.
- All 11 frontend tests passed.
- Existing premium UI browser suite: 42 checks passed, including desktop and phone authentication layouts.
- Phone browser audit: 120 screen checks passed with no detected horizontal overflow or browser runtime errors. It covers 22 routes/project sections at 320, 390, 430, and 768 pixels in portrait and 844 × 390 in landscape, plus task dialogs at each size.
- Additional 320 × 568 checks cover project, skill, member invitation, and milestone dialogs, project section selection, navigation drawer dismissal, and dark mode.
- API requests are intercepted with isolated fixtures, including long project names and email addresses. These checks do not send real invitations or change server data.
- Browser viewport testing uses installed Chrome; physical device keyboards and Safari were not tested.

## Evidence

Run `node scripts/audit/phone-ui-check.mjs` from the repository root. It saves measurements to [audit.json](phone-ui-evidence/audit.json) and screenshots in `phone-ui-evidence`.

- [Portrait dashboard](phone-ui-evidence/dashboard-390.png)
- [Landscape dashboard](phone-ui-evidence/dashboard-844.png)
- [Small-screen task form, scrolled to actions](phone-ui-evidence/task-dialog-320.png)
- [Dark dashboard](phone-ui-evidence/dashboard-dark-320.png)

Responsive rules are centralized in `frontend/src/phone.css`, with shared layout and dialog changes in the relevant React components. No dependencies were added.
