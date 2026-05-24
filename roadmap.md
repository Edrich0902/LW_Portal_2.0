# LW Portal 2.0 — Roadmap

LW Portal is the **content management and operational hub** for the LW Flutter app. Everything the congregation sees in the app — sermons, events, announcements, groups, tithes info — is authored, curated, and published here. The roadmap below extends the Portal from a basic CMS into a full church operations platform that makes the admin team's daily work faster and the Flutter app richer.

Features are organized by operational impact, not technical layer. Priority order within each section runs high → lower.

---

## Phase 1 — Pastoral Care & Member Lifecycle

These are the highest-leverage features because they directly support the people the church is responsible for.

### 1.1 Attendance Tracking
Record attendance per service or event. Mark members and guests present, track first-timers separately, and see trends over time. A simple "Check In" flow per event date is enough — no hardware needed.
- Per-event attendance registers linked to existing `Event` records
- Mark `User` as present, absent, or first-timer
- Weekly attendance count stored for trend reporting
- First-timer flag triggers a follow-up task automatically

### 1.2 First-Timer & New Member Pipeline
A structured follow-up workflow for visitors. Currently `is_member` is a binary flag — this adds the journey in between.
- Introduce a `journey_stage` field on `User`: `visitor → regular → membership_class → member`
- Assign a pastoral owner to each person in the pipeline
- Log notes and follow-up actions per person (private, pastoral-only)
- Dashboard widget showing how many people are at each stage

### 1.3 Pastoral Notes & Care Log
Private, confidential notes per member — counseling sessions, prayer points, significant life events. Never visible to non-pastoral roles.
- Notes attached to a `User` record with `created_by` and `created_at`
- Role-gated: only `SUPER_ADMIN` / future `PASTOR` role can read/write
- Note categories: Counseling, Prayer, Pastoral Visit, General

### 1.4 Birthday & Anniversary Reminders
Store member dates of birth and membership anniversary. Surface upcoming ones on the dashboard so the pastoral team never misses a moment.
- Add `date_of_birth` and `membership_date` to `User`
- Dashboard widget: "This week's birthdays / anniversaries"
- Optional: trigger an announcement draft or WhatsApp message

### 1.5 Prayer Requests
Members submit prayer requests via the Flutter app; the Portal is where the team reviews and manages them. Closes the loop between the app and the pastoral team.
- Prayer request queue with statuses: `new → praying → answered → archived`
- Assign to a specific intercessor or prayer team
- Mark answered with a note — optionally push a "your prayer was answered" notification back to the user via the Flutter app
- Dashboard count of open requests

---

## Phase 2 — Worship & Services

### 2.1 Sermon Series Management
Group sermons into a named series with its own artwork and description. Improves content discoverability for the member-facing app.
- `Series` entity: title, description, banner image, start/end dates
- Link multiple `Sermon` records to a series
- Series view with episode list and progress indicator

### 2.2 Order of Service / Bulletin Builder
Build the weekly service order inside the portal and export it as a PDF or shareable link. Eliminates the back-and-forth WhatsApp editing of a Word document.
- Drag-and-drop order of service items (Welcome, Worship, Tithe, Sermon, Announcements, etc.)
- Add times, leaders, and notes per item
- One-click PDF export using a clean printable template
- Optional: lock the bulletin after Saturday night so no last-minute changes

### 2.3 Worship Team Roster Scheduling
Schedule who serves in which role across services. Replaces the spreadsheet or WhatsApp group most churches use.
- Roles: Sound, Projector, Worship Leader, Band, Ushers, Welcome Team, etc.
- Weekly schedule view — assign people from the `Roleplayer` list or `User` list
- Conflict detection (person already on roster that day)
- Export schedule to PDF or send via WhatsApp

### 2.4 Song Library
A searchable library of songs used in worship — lyrics, chords, key, CCLI number. Saves the Worship Leader from searching every Sunday.
- Fields: title, artist, key, tempo, tags, lyrics/chords (rich text), CCLI number
- Attach to Order of Service items
- Search by title, key, or tag

---

## Phase 3 — Operations & Communications

### 3.1 Announcement Scheduling
Set a `publish_at` datetime on an announcement so it goes live automatically. Currently announcements are manually pushed — this removes the Sunday morning scramble.
- Add `publish_at` field to `Announcement`
- Supabase Edge Function (or cron) flips state from `pending → sent` at the right time
- Scheduled announcements shown clearly in the list with a countdown

### 3.2 WhatsApp / SMS Integration
Send announcements directly from the portal via WhatsApp Business API or an SMS gateway (e.g. Twilio, Africa's Talking). Meets members where they actually are.
- Connect a WhatsApp Business or SMS provider in Settings
- "Send via WhatsApp" action on any announcement
- Log delivery status per message
- Opt-out tracking to respect member preferences

### 3.3 Push Notification Integration
Firebase Cloud Messaging integration to push announcements to the member-facing app.
- Store FCM tokens against `User` records
- "Push" action alongside existing announcement actions
- Delivery receipts shown in the announcement detail

### 3.4 Small Groups / Cell Groups Management
The `Group` type exists but there is no dedicated management screen. Cell groups are central to most church discipleship strategies.
- Full CRUD screen for Groups (Home Cell, Youth, Men's, Ladies', etc.)
- Assign a group leader from the `User` list
- Enroll members into groups — many-to-many `user_groups` junction
- Group attendance tracking per meeting date

### 3.5 Resource Library
A place to upload and organize PDFs, study guides, and documents. Replaces the endless WhatsApp file forwards.
- File upload to Cloudinary (PDF, DOCX support)
- Categories: Bible Study, Sermon Notes, Forms, Policies
- Searchable by title and category
- Optional: restrict downloads by role

---

## Phase 4 — Analytics & Reporting

### 4.1 Interactive Dashboard Charts
Replace the static stat cards with live charts that show growth over time. Pastors and elders need to see trends, not just snapshots.
- Member growth chart (new users per month, rolling 12 months)
- Attendance trend chart per service type
- Baptism and membership conversion funnel
- Giving trend (if giving records are tracked)

### 4.2 Giving / Tithe Tracking
Currently the portal only stores banking details. Adding individual giving records enables generosity reporting and stewardship conversations.
- Log giving entries: `user`, `amount`, `date`, `type` (tithe, offering, special)
- Monthly and annual giving summaries per member
- Aggregate reporting: total giving per month, year-on-year comparison
- Export to CSV for the treasurer

### 4.3 Custom Report Builder
Let admins build their own filtered exports without needing a developer.
- Choose entity (Users, Attendance, Giving, etc.)
- Apply filters (date range, status, group membership, etc.)
- Export as CSV or PDF

### 4.4 Engagement Metrics
Track content views and interactions for Sermons and Announcements to understand what resonates.
- View count on Sermon and Announcement records (incremented by member app)
- "Most viewed" widgets on the dashboard
- Series completion rate for sermon series

---

## Phase 5 — System Health & Tooling

### 5.1 Global Search (Cmd+K Command Palette)
Keyboard-first navigation across all entities — Users, Sermons, Events, Announcements, Groups, etc. Saves enormous time for power users.
- `Cmd+K` opens a floating search bar
- Fuzzy search across all entity titles and names
- Jump directly to the record detail or management screen
- Recent searches persisted locally

### 5.2 Activity Log (Audit Trail)
A system-wide log of every create, update, and delete action with the actor's identity and timestamp. Essential for accountability in a multi-admin environment.
- Middleware-level logging — no service call goes unlogged
- Filterable log view: by user, by entity type, by date range
- Diff view showing what changed (old value → new value)
- Log entries are immutable — no delete action on logs

### 5.3 Granular Role System
Expand beyond `SUPER_ADMIN / USER` to give specific access without granting full admin rights.
- Roles: `SUPER_ADMIN`, `PASTOR`, `EDITOR`, `SOCIAL_MEDIA`, `TREASURER`, `VIEWER`
- Each role has a defined permission matrix (read/write per module)
- Role assignment managed from the Users screen
- Sensitive modules (Pastoral Notes, Giving Records) require `PASTOR` or above

### 5.4 Bulk Actions
Multi-select rows in any DataTable and apply actions in one operation. Prevents the tedious one-by-one workflow.
- Select multiple records via checkbox column
- Context-sensitive action menu: delete, change status, assign to group, export selection
- Confirmation dialog with preview of affected records

### 5.5 Media Library
A dedicated screen to browse, search, and reuse images already uploaded to Cloudinary — instead of re-uploading the same banner every week.
- Grid view of all uploaded images, sortable by date and entity type
- Search by filename or tag
- Click to insert into any image field (announcements, events, sermons)
- Support for alt-text, captions, and tags on each asset

### 5.6 Settings & Integrations Hub
A single Settings screen for all portal-wide configuration — today this is scattered or hardcoded.
- Church profile: name, logo, address, social handles
- Integration credentials: WhatsApp, Firebase, SMS gateway
- Notification preferences per admin user
- Danger zone: data export, account deletion

---

## Phase 6 — Flutter App Integration & Content Experience

These features are specifically about making the Portal the smart control layer for the Flutter app — what gets shown, when, and how.

### 6.1 Featured Content Pinning
Control what appears prominently on the Flutter app home screen directly from the portal. Turns the home screen from "latest stuff" into intentional editorial curation.
- Pin any entity (sermon, series, event, announcement) to a "featured" slot
- Set an expiry date so pins auto-clear after the relevant date
- Drag-and-drop ordering of featured items
- Preview how the home screen layout will look before publishing

### 6.2 Live Service Mode
A "Go Live" button that flips the Flutter app into a live-service state instantly. Replaces the manual "we're live!" WhatsApp blast every Sunday morning.
- One-tap toggle on the dashboard — sets a `is_live` flag with a stream URL
- Automatically pushes a notification to all app users
- Flutter app surfaces the live stream link prominently while active
- Auto-reverts after a configurable duration (e.g. 3 hours) or manual stop

### 6.3 Testimonies Module
Members submit testimonies via the Flutter app; the Portal holds them in a moderation queue before anything goes public. Creates a content loop between the congregation and the app.
- Submission queue: `pending → approved → rejected`
- Admin can edit for length/clarity before approving
- Approved testimonies appear in a dedicated Flutter app feed
- Optional: feature a testimony on the home screen via 6.1 pinning

### 6.4 Devotional / Daily Reading
A new content type — short daily devotionals (scripture + reflection + prayer point) authored in the portal and surfaced as a daily push notification in the Flutter app. Drives daily app engagement, not just Sunday.
- Fields: date, scripture reference, body (rich text), prayer prompt
- Schedule devotionals in advance (week or month at a time)
- Push notification fires at a configurable time each morning
- Archive view so members can catch up on missed days

### 6.5 Content Calendar
A single calendar view showing everything scheduled across all modules — announcements going live, events, sermon uploads, devotionals, group meetings. Prevents clashes and gives the team a birds-eye view of the week.
- Month and week view modes
- Color-coded by content type
- Click any item to jump directly to its edit screen
- Highlight conflicts (e.g. two announcements publishing at the same time)

### 6.6 Admin Notification Center
An in-app notification bell for portal users — surfaces what needs attention without having to check each module manually.
- Unread badge count on the bell icon in the nav
- Notification types: new prayer requests, new testimonies pending approval, announcements going live soon, new first-timers registered
- Mark as read individually or all at once
- Click a notification to jump directly to the relevant record

---

## Phase 7 — AI-Powered Tools

Practical AI features that reduce repetitive work for the admin team.

### 7.1 AI Sermon Tools
Paste a YouTube link or sermon transcript and get auto-generated content for the Flutter app — powered by the Claude API.
- Auto-generate a sermon summary (2–3 paragraphs)
- Extract and list key scripture references
- Generate small group discussion questions (5–7 questions)
- All outputs are editable before publishing alongside the sermon record

### 7.2 Social Media Composer
Elevate the existing social media module with AI-assisted drafting. Turn one sermon into a week of content in minutes.
- "Create posts from this sermon" action on any sermon record
- AI drafts platform-specific captions (Instagram, Facebook, X) with relevant hashtags
- Pull a quote from the sermon body as a graphic text overlay
- Schedule posts to go out across the week via the existing social media module

### 7.3 Announcement Drafting Assistant
Start typing an announcement and get an AI-assisted draft — useful for admins who aren't confident writers.
- "Draft for me" button in the announcement editor
- Provide a one-line brief → AI returns a polished announcement body
- Adjust tone: formal, friendly, urgent
- Always editable — AI output is a starting point, not the final word

---

## Phase 8 — Extended Operations

Useful operational features that improve day-to-day church admin without being core to the content hub role.

### 8.1 Event QR Check-in
Each event gets a unique QR code. A volunteer opens the portal on their phone, scans a member's app QR, and the attendance is logged. No hardware, no clipboard, no retrospective spreadsheet.
- Auto-generate a QR code per event date
- Members have a personal QR in the Flutter app
- Portal mobile scan view for volunteers (camera access in browser)
- Real-time attendance count updates on the event record

### 8.2 Giving Statements
Auto-generate a PDF giving statement per member showing all logged tithes and offerings for a selected period. Eliminates the manual Excel work at year-end.
- Select member + date range → generate PDF
- Church letterhead, logo, and registered details pulled from Settings
- Bulk generate for all members with giving records
- Email or WhatsApp the statement directly from the portal

### 8.3 Volunteer Hour Tracking
Track hours served by volunteers across ministries. Useful for recognition, reporting to elders, and understanding who is over-committed.
- Log hours per volunteer per ministry/role
- Monthly and annual summaries per person
- Leaderboard-style recognition view (opt-in)
- Export for elder or board reporting

### 8.4 Content Templates
Save any announcement, event, or bulletin as a reusable template. Particularly useful for recurring formats like weekly service announcements or seasonal events.
- "Save as template" action on any content record
- Templates library screen with search and category filter
- "Create from template" pre-populates the form — just update the specifics
- Share templates across admin users

---

## Out of Scope (Intentional)

The following are deliberately excluded to keep the Portal focused on its role as a content and operations hub:

- **Online giving / payment processing** — handled by the bank / SnapScan setup already in place; adding payment processing brings PCI compliance complexity that is out of scope.
- **Multi-campus support** — single campus assumed; can be revisited if the church plants.
- **Member-facing UI** — all member-facing features (browsing sermons, RSVPs, prayer submissions, notifications) belong in the Flutter app. The Portal is the authoring and management layer only.
- **Custom domain email campaigns** — use an existing tool like Mailchimp; the Portal handles push notifications and WhatsApp communications.
