# Events Feature — Engineering Notes

Non-obvious decisions, constraints, and quirks for the events feature. Read this before modifying the events calendar, modal, or RSVP behaviour.

Owners of the relevant files:
- `src/components/lwp-event-calendar/LwpEventCalendar.vue`
- `src/views/events/EventsView.vue`
- `src/views/events/EventsModal.vue`
- `src/stores/events/events.store.ts`
- `src/services/events/events-service.ts`
- `src/services/event-rsvp/event-rsvp-service.ts`
- `src/stores/event-overview/event-overview.store.ts`

---

## 1. Drag-to-reschedule has asymmetric behaviour by event type

The drag handler in `LwpEventCalendar.vue:handleEventDrop` deliberately branches on `EventType`:

| Event type | What drag updates |
|---|---|
| `EventType.ONCE` | `start_date`, `day`, `time` (in timeGrid views), and `end_date` (shifted by the same day delta — preserves multi-day duration) |
| Recurring (`WEEKLY` / `DAILY` / `MONTHLY` / `YEARLY`) | Only `day` (and `time` in timeGrid views). Series anchors `start_date` and `end_date` are **not** modified. Confirms via `useConfirm` before applying. No-op short-circuit if neither day nor time actually changed. |

### Why

An earlier version wrote `start_date` on every drag. Dragging a later occurrence of a recurring series (e.g. the Jan 8 occurrence of a Monday-weekly series starting Jan 1) moved the series anchor forward, which made earlier occurrences disappear from the calendar.

The current behaviour preserves historical occurrences while still letting the user change the day-of-week or time via drag. To shift an entire series forward/backward in time, the user edits the event in the modal directly.

### When working in this area

- Keep the once-off and recurring branches separate.
- Do **not** write `start_date` or `end_date` on a recurring drag.
- The `end_date` delta-shift logic belongs in the once-off branch only.
- Drag is gated on `UserRole.SUPER_ADMIN`. Non-admins must not be able to drag — both `editable` and `eventStartEditable` are bound to a `computed` over `authStore.userProfile?.role`.

---

## 2. RSVPs are scoped to once-off future events only

`sbGetEventRsvpSummary()` in `src/services/event-rsvp/event-rsvp-service.ts` joins the `events` table with the `event_rsvp_summary` view, **filtered server-side to events with `type = 'once'` and a future `start_date`**. There is no RSVP data for recurring events.

### Why

RSVPs are tied to specific dated occurrences. A recurring weekly cell-group doesn't have a meaningful single "attending" count — each week's attendance would need its own record, which isn't how the schema is designed. RSVPs are deliberately scoped to once-off events (special services, courses, vroue oggend, etc.).

### When working in this area

- Anywhere you surface RSVP data (calendar capacity badge, hover-popover RSVP tag, event-overview view), gate it on `event.type === EventType.ONCE`. The calendar component already does this in `getBadgeFor()` and the `popoverRsvp` computed.
- Don't extend RSVP counts to recurring events without a schema change first. If you need per-occurrence attendance, that's a new feature — model it before building it.

---

## 3. FullCalendar setup quirks

The calendar uses FullCalendar v6 with `@fullcalendar/vue3`. Several setup details are non-obvious and easy to break.

### Required plugins (silent prerequisites)

| Plugin | Required for |
|---|---|
| `@fullcalendar/daygrid` | Month view |
| `@fullcalendar/timegrid` | Week / Day views |
| `@fullcalendar/list` | List view button |
| `@fullcalendar/rrule` | Recurring events (the `rrule` field is ignored without it) |
| `@fullcalendar/interaction` | **`dateClick`, `eventDrop`, `eventResize`** — these handlers silently never fire without it. No error is thrown. |

The `interaction` plugin is the most common silent failure. If a click-to-create or drag-to-reschedule handler isn't firing, check the plugin list first.

### Events must flow through reactive `:options.events`, not imperative API

The Vue3 wrapper deeply watches `options` and calls `resetOptions()` on change. Using `calendarRef.value.getApi().addEventSource()` inside `onMounted` is unreliable — the calendar instance isn't always ready, and it conflicts with the wrapper's watcher.

**Correct pattern:**

```ts
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [...],
  events: mappedEvents.value,
  // ...
}))
```

```vue
<FullCalendar :options="calendarOptions" />
```

### rrule object shape

- `freq` must match an `RRule.<UPPERCASE>` constant. The rrule plugin does `RRule[freq.toUpperCase()]` internally, so passing the `EventType` enum values (`'weekly'`, `'daily'`, `'monthly'`, `'yearly'`) works directly.
- `byweekday` accepts lowercase `'mo'`, `'tu'`, `'we'`, `'th'`, `'fr'`, `'sa'`, `'su'`. The plugin uppercases them when resolving `RRule.<DAY>`.
- `dtstart` and `until` accept ISO strings. Sanitize inputs: strip any time portion from a DATE column value (e.g. `'2024-01-15T00:00:00+00:00'` → `'2024-01-15'`) before concatenating with a time, otherwise you produce invalid `'2024-01-15T00:00:00T18:30:00'`. `safeDate()` and `safeTime()` in the calendar component handle this.

### Per-view `dayHeaderFormat`

In month view, the columns represent **weekdays**, not specific dates. A `dayHeaderFormat` that includes `day: 'numeric'` will show an arbitrary reference week (typically Jan 4–10) regardless of the actual month being viewed.

Configure formats per view via the top-level `views` option:

```ts
views: {
  dayGridMonth: { dayHeaderFormat: { weekday: 'short' } },
  timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true } },
  timeGridDay: { dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'short', omitCommas: true } },
}
```

### Custom event content + hover tooltip

- The Vue3 wrapper supports `<template #eventContent="arg">` to render Vue templates inside event blocks. Do **not** also set `eventContent` in `calendarOptions` — only one wins.
- For hover tooltips, drive a single shared PrimeVue `<Popover>` via `eventMouseEnter` / `eventMouseLeave` callbacks. Position via `popoverRef.value.show({ currentTarget: arg.el } as unknown as Event, arg.el)`. Always set `appendTo="body"` on the Popover to escape FullCalendar's overflow clipping. A ~150 ms delayed hide prevents flicker when the cursor crosses the gap between block and popover.

### `info.revert()` on `eventDrop`

`confirm.require()` is fire-and-forget — it does not return a promise. To revert a drag on cancellation or failure:

- Call `info.revert()` inside the Confirm `reject` callback.
- Call `info.revert()` inside the `accept` callback whenever the store action returns `false`.
- Do **not** try to revert outside the confirm callbacks.

---

## 4. EventsModal pre-fill mechanism

The modal accepts two mutually-exclusive seeds:

- `eventItem?: Event` — full event for **edit** mode. Used when the user clicks an existing event.
- `defaultEventData?: Partial<Event>` — partial seed for **create-with-defaults**. Used when the user clicks an empty calendar slot. Falls back to defaults when `eventItem` is undefined.

The modal builds `initialValues` once in `onBeforeMount`. To force a fresh mount on every open (so updated underlying data is picked up), `EventsView` increments a `modalOpenCount` ref and uses it as the modal's `:key`. Every open path (`onRowClick`, `onAdd`, `onCalendarDateClick`, `onCalendarEventClick`) funnels through a single `openModal(eventItem?, defaults?)` helper that bumps the counter.

### When working in this area

- Don't use `JSON.stringify(selectedItem)` as the key — it doesn't change between two consecutive opens of the same event after a reschedule, leaving stale `initialValues`.
- If you add a new modal-open path, route it through `openModal` so the counter bump happens.

---

## 5. Reschedule store action refreshes from the DB

`eventsStore.rescheduleEvent(id, fields)` calls `sbUpdateEventFields(...)` and, on success, re-fetches both data sources (`sbFetchAllEvents()` for `calendarEvents` and `queryEvents()` for the table `data`). This is intentionally over-eager rather than relying on optimistic in-place mutation.

### Why

In-place `Object.assign` on reactive proxies didn't reliably propagate to every consumer (the table page, the open hover popover, the modal's cached `initialValues`). Refreshing from the DB after a successful update is a small extra round-trip in exchange for guaranteed UI consistency.

### When working in this area

If you add another mutation path that affects an event in flight (e.g. inline rename), prefer DB-refresh-on-success over optimistic mutation unless you have a specific reason to need the optimistic UX.
