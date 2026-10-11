# ProjectOps navigation layout fix

Root cause: the shared ChatTab called `bottomRef.scrollIntoView({behavior: 'smooth'})` on mount and on each message. That API scrolls ancestor containers, including the outer shell even though it used `overflow: hidden`. The assistant's independently sized chat (60vh, minimum 320px) plus heading and footer overflowed the frame; the health body was squeezed to 32px. On the 1280×600 reproduction, shell scrollTop changed from 0 to 97px, moving the header from y=25 to y=-72 and leaving a 97px strip below the displaced main/sidebar. Document scrollY stayed 0, so resetting document scroll alone would not fix this defect.

The sidebar uses router links and ProjectDetail has no autofocus, scrollIntoView, or transform responsible for the displacement. Its negative margins intentionally compensate for main-panel padding. No ProjectDetail changes were necessary.

Focused source changes:
- `frontend/src/index.css`: shell is a viewport-sized flex column with one fixed header row and one shrinking content row. Shell/frame use overflow:clip so they are not hidden scroll containers. Main and assistant flex children use min-height:0. Main and sidebar retain their own scrollbars. Mobile assistant is anchored to the frame at top:0, beneath the header exactly once. Mobile navigation uses the same header-height variable. Assistant heading/context do not shrink.
- `frontend/src/components/WorkspaceAssistant.jsx`: moved chat into the existing assistant-body scroll area. Health and chat share normal assistant-body scrolling; the footer stays inside the viewport.
- `frontend/src/components/ProjectTabs.jsx`: autoscroll directly sets only the chat message-list scrollTop. The list has min-height:0; no ancestor scrollIntoView call remains.
- `frontend/src/layouts/MainLayout.jsx`: route changes reset only main-panel scroll; drawer focus uses preventScroll. Sidebar links close the mobile drawer even when clicked repeatedly on the current route.

Regression: `scripts/audit/layout-navigation.spec.mjs` uses isolated API fixtures, with no writes to existing projects. It captures screenshot and scroll/rectangle evidence and asserts Settings → ProjectOps → Overview → AI Chat → Milestones → Work items → Settings, repeated project clicks, assistant open/closed states, chat focus, long new replies, and manual message scrolling. Main, sidebar, assistant-body, shell and document positions are checked independently. Settings remains scrollable and short project content retains natural unused space.

Verified viewports: desktop 1910×829, compact desktop 1280×600, mobile 390×844. After the fix, shell scrollTop and document scrollY remain 0; compact desktop header remains y=25, main starts at y=67 and ends at y=575 within the 600px viewport. Mobile header remains y=0, main/assistant start at y=42 and end at y=844. Chat focus and replies do not move main/sidebar; replies scroll only the message list.

Verification: six Chromium checks passed (three new layout scenarios, two existing authentication button checks, one existing sidebar chat check). Production build and all eleven frontend tests passed. Browser navigation used mocked project data to isolate the layout defect; no backend business logic was changed. Real mobile keyboard behavior was not emulated.

Screenshots and measurements are in `docs/layout-evidence/`:

| Viewport | Before project | After project | Settings reference | Chat after focus/reply |
| --- | --- | --- | --- | --- |
| Desktop | [Before](layout-evidence/before-desktop-project.png) | [After](layout-evidence/after-desktop-project.png) | [Settings](layout-evidence/after-desktop-settings.png) | [Chat](layout-evidence/after-desktop-chat.png) |
| Compact desktop | [Before](layout-evidence/before-compact-desktop-project.png) | [After](layout-evidence/after-compact-desktop-project.png) | [Settings](layout-evidence/after-compact-desktop-settings.png) | [Chat](layout-evidence/after-compact-desktop-chat.png) |
| Mobile | [Before](layout-evidence/before-mobile-project.png) | [After](layout-evidence/after-mobile-project.png) | [Settings](layout-evidence/after-mobile-settings.png) | [Chat](layout-evidence/after-mobile-chat.png) |

Run the regression with `npx playwright test --config=scripts/audit/playwright.config.mjs scripts/audit/layout-navigation.spec.mjs`. Baseline captures were taken before editing source, using `LAYOUT_BASELINE=1`; do not enable that variable for regression assertions.
