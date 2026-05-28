<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import type {
  CalendarOptions,
  EventClickArg,
  EventDropArg,
  EventHoveringArg,
  EventInput,
} from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { computed, ref } from 'vue'
import moment from 'moment'
import { useConfirm } from 'primevue/useconfirm'
import type { Event } from '@/types/event/event.ts'
import { EventType } from '@/types/eventType.ts'
import { EventCategory } from '@/types/eventCategory.ts'
import { Weekday } from '@/types/weekday.ts'
import { UserRole } from '@/types/user/user.ts'
import type { EventRsvpSummaryRow } from '@/types/event-rsvp/event-rsvp.ts'
import { useAuthStore } from '@stores/auth/auth.store.ts'
import { useEventsStore } from '@stores/events/events.store.ts'

const props = defineProps<{
  events: Event[]
  rsvpSummaries?: Map<string, EventRsvpSummaryRow>
}>()
const emit = defineEmits<{
  (e: 'eventClick', event: Event): void
  (e: 'dateClick', payload: { date: string; day: Weekday; time?: string }): void
}>()

const authStore = useAuthStore()
const eventsStore = useEventsStore()
const confirm = useConfirm()

const isEditable = computed(
  () => authStore.userProfile?.role === UserRole.SUPER_ADMIN,
)

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
]

const CATEGORY_COLOR: Record<EventCategory, string> = {
  [EventCategory.GENERAL]: '#3b82f6',
  [EventCategory.ONCEOFF]: '#f97316',
  [EventCategory.COURSE]: '#22c55e',
}

const WEEKDAY_MAP: Record<Weekday, string> = {
  [Weekday.MONDAY]: 'mo',
  [Weekday.TUESDAY]: 'tu',
  [Weekday.WEDNESDAY]: 'we',
  [Weekday.THURSDAY]: 'th',
  [Weekday.FRIDAY]: 'fr',
  [Weekday.SATURDAY]: 'sa',
  [Weekday.SUNDAY]: 'su',
}

// Sanitize a date string from Supabase to YYYY-MM-DD.
// Handles both DATE columns ('2024-01-15') and TIMESTAMP columns ('2024-01-15T00:00:00+00:00').
function safeDate(date?: string | null): string | undefined {
  if (!date) return undefined
  if (date.includes('T')) return date.split('T')[0]
  if (date.includes(' ')) return date.split(' ')[0]
  return date
}

// Normalise a time string to HH:MM:SS. Handles '10:00', '10:00:00', '10:00:00+02', '10:00:00.000'.
function safeTime(time?: string | null): string {
  if (!time) return '00:00:00'
  const stripped = time.split(/[+\-.]/)[0]
  const parts = stripped.split(':')
  const hh = (parts[0] ?? '00').padStart(2, '0')
  const mm = (parts[1] ?? '00').padStart(2, '0')
  const ss = (parts[2] ?? '00').padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// Default dtstart for recurring events when no start_date is set — one year in the past
// so the recurrence covers the current view.
function defaultDtStart(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().split('T')[0]
}

function toCalendarEvent(event: Event): EventInput | null {
  const color = CATEGORY_COLOR[event.category] ?? '#6366f1'
  const time = safeTime(event.time)
  const startDate = safeDate(event.start_date)
  const endDate = safeDate(event.end_date)

  if (event.type === EventType.ONCE) {
    if (!startDate) return null
    return {
      id: event.id,
      title: event.title,
      start: `${startDate}T${time}`,
      end: endDate ? `${endDate}T${time}` : undefined,
      color,
      extendedProps: { rawEvent: event },
    }
  }

  const dtstart = `${startDate ?? defaultDtStart()}T${time}`

  const rrule: Record<string, unknown> = {
    freq: event.type,
    dtstart,
  }
  if (endDate) rrule.until = `${endDate}T23:59:59`
  if (event.type === EventType.WEEKLY) {
    const byday = event.day ? WEEKDAY_MAP[event.day] : undefined
    if (byday) rrule.byweekday = [byday]
  }

  return {
    id: event.id,
    title: event.title,
    rrule,
    duration: '01:00:00',
    color,
    extendedProps: { rawEvent: event },
  } as EventInput
}

const mappedEvents = computed<EventInput[]>(() => {
  const out: EventInput[] = []
  for (const e of props.events) {
    const mapped = toCalendarEvent(e)
    if (mapped) out.push(mapped)
  }
  return out
})

// ---------- Hover tooltip state ----------

const tooltipPopover = ref()
const hoveredEvent = ref<Event | null>(null)
const hoveredRsvp = ref<EventRsvpSummaryRow | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const cancelHide = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const scheduleHide = () => {
  cancelHide()
  hideTimer = setTimeout(() => tooltipPopover.value?.hide(), 150)
}

const popoverWhen = computed(() => {
  const ev = hoveredEvent.value
  if (!ev) return ''
  const time = ev.time ? ev.time.slice(0, 5) : ''
  if (ev.type === EventType.ONCE) {
    const start = ev.start_date ? moment(ev.start_date).format('DD MMM YYYY') : ''
    return time ? `${start} at ${time}` : start
  }
  const day = ev.day ?? ''
  return time ? `Every ${day} at ${time}` : `Every ${day}`
})

const popoverRsvp = computed(() => {
  const ev = hoveredEvent.value
  const rsvp = hoveredRsvp.value
  if (!ev || !rsvp || ev.type !== EventType.ONCE) return null
  const capacity = rsvp.capacity ?? null
  const attending = rsvp.attending_count
  if (capacity != null && attending >= capacity) {
    return { text: 'FULL', severity: 'danger' as const }
  }
  if (capacity != null) {
    return { text: `${attending}/${capacity} attending`, severity: 'info' as const }
  }
  return { text: `${attending} attending`, severity: 'info' as const }
})

// ---------- RSVP badge helpers (event blocks) ----------

const getBadgeFor = (eventId: string, raw: Event | undefined) => {
  if (!raw || raw.type !== EventType.ONCE) return null
  const summary = props.rsvpSummaries?.get(eventId)
  if (!summary) return null
  const attending = summary.attending_count
  const capacity = summary.capacity ?? null
  if (capacity != null && attending >= capacity) {
    return { text: 'FULL', full: true }
  }
  if (capacity != null) return { text: `${attending}/${capacity}`, full: false }
  if (attending > 0) return { text: `${attending}`, full: false }
  return null
}

// ---------- Calendar callbacks ----------

const handleDateClick = (arg: DateClickArg) => {
  const dateOnly = arg.dateStr.split('T')[0]
  const day = JS_DAY_TO_WEEKDAY[arg.date.getDay()]
  const isTimeGrid = arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay'
  if (isTimeGrid) {
    emit('dateClick', { date: dateOnly, day, time: moment(arg.dateStr).format('HH:mm') })
  } else {
    emit('dateClick', { date: dateOnly, day })
  }
}

const handleEventMouseEnter = (arg: EventHoveringArg) => {
  cancelHide()
  const raw = arg.event.extendedProps.rawEvent as Event | undefined
  if (!raw) return
  hoveredEvent.value = raw
  hoveredRsvp.value = props.rsvpSummaries?.get(raw.id) ?? null
  tooltipPopover.value?.show({ currentTarget: arg.el } as unknown as Event, arg.el)
}

const handleEventMouseLeave = () => {
  scheduleHide()
}

const handleEventDrop = async (info: EventDropArg) => {
  if (!isEditable.value) {
    info.revert()
    return
  }

  const raw = info.event.extendedProps.rawEvent as Event | undefined
  const newStart = info.event.start
  if (!raw || !newStart) {
    info.revert()
    return
  }

  const isTimeGrid =
    info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay'

  const newWeekday = JS_DAY_TO_WEEKDAY[newStart.getDay()]
  const newTime = isTimeGrid ? moment(newStart).format('HH:mm') : undefined

  if (raw.type === EventType.ONCE) {
    const fields: Partial<Pick<Event, 'start_date' | 'end_date' | 'time' | 'day'>> = {
      start_date: moment(newStart).format('YYYY-MM-DD'),
      day: newWeekday,
    }
    if (newTime) fields.time = newTime

    if (raw.end_date && info.oldEvent.start) {
      const oldStartDay = moment(info.oldEvent.start).startOf('day')
      const newStartDay = moment(newStart).startOf('day')
      const dayDelta = newStartDay.diff(oldStartDay, 'days')
      if (dayDelta !== 0) {
        fields.end_date = moment(raw.end_date).add(dayDelta, 'days').format('YYYY-MM-DD')
      }
    }

    const ok = await eventsStore.rescheduleEvent(raw.id, fields)
    if (!ok) info.revert()
    return
  }

  // Recurring: only update the day-of-week (and time in timeGrid views).
  // Series anchors (start_date / end_date) stay put so earlier occurrences aren't lost.
  const recurringFields: Partial<Pick<Event, 'time' | 'day'>> = { day: newWeekday }
  if (newTime) recurringFields.time = newTime

  const dayChanged = newWeekday !== raw.day
  const timeChanged =
    newTime !== undefined && newTime !== (raw.time ? raw.time.slice(0, 5) : '')

  if (!dayChanged && !timeChanged) {
    info.revert()
    return
  }

  confirm.require({
    target: info.el,
    message: 'This will change the day/time for all occurrences of this recurring event. Continue?',
    icon: 'pi pi-info-circle',
    acceptProps: { label: 'Update' },
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    accept: async () => {
      const ok = await eventsStore.rescheduleEvent(raw.id, recurringFields)
      if (!ok) info.revert()
    },
    reject: () => info.revert(),
  })
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, rrulePlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
  },
  buttonText: {
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    list: 'List',
  },
  events: mappedEvents.value,
  eventClick: (arg: EventClickArg) => {
    emit('eventClick', arg.event.extendedProps.rawEvent as Event)
  },
  dateClick: handleDateClick,
  eventMouseEnter: handleEventMouseEnter,
  eventMouseLeave: handleEventMouseLeave,
  eventDrop: handleEventDrop,
  editable: isEditable.value,
  eventStartEditable: isEditable.value,
  eventDurationEditable: false,
  eventDisplay: 'block',
  displayEventEnd: true,
  eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  views: {
    dayGridMonth: {
      dayHeaderFormat: { weekday: 'short' },
    },
    timeGridWeek: {
      dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true },
    },
    timeGridDay: {
      dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'short', omitCommas: true },
    },
  },
  nowIndicator: true,
  allDaySlot: false,
  scrollTime: '07:00:00',
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  dayMaxEvents: 3,
  businessHours: {
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: '08:00',
    endTime: '17:00',
  },
  selectable: false,
  height: 'auto',
}))
</script>

<template>
  <div
    class="lwp-calendar p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm"
  >
    <FullCalendar :options="calendarOptions">
      <template #eventContent="arg">
        <div class="flex items-center gap-1 min-w-0 w-full overflow-hidden">
          <span v-if="arg.timeText" class="fc-event-time">{{ arg.timeText }}</span>
          <span class="fc-event-title flex-1 truncate">{{ arg.event.title }}</span>
          <span
            v-if="getBadgeFor(arg.event.id, arg.event.extendedProps.rawEvent)"
            class="rsvp-badge"
            :class="{ 'rsvp-full': getBadgeFor(arg.event.id, arg.event.extendedProps.rawEvent)?.full }"
          >{{ getBadgeFor(arg.event.id, arg.event.extendedProps.rawEvent)?.text }}</span>
        </div>
      </template>
    </FullCalendar>

    <Popover ref="tooltipPopover" appendTo="body" @mouseenter="cancelHide" @mouseleave="scheduleHide">
      <div v-if="hoveredEvent" class="flex flex-col gap-2 w-64 text-sm p-1">
        <LwpImage
          v-if="hoveredEvent.banner_public_id"
          :public-id="hoveredEvent.banner_public_id"
          :width="256"
          :height="128"
          class-name="w-full h-32 rounded-md"
        />
        <div class="font-semibold">{{ hoveredEvent.title }}</div>
        <div class="text-xs text-surface-500">{{ popoverWhen }}</div>
        <div v-if="hoveredEvent.description" class="text-xs whitespace-pre-line">
          {{ hoveredEvent.description }}
        </div>
        <Tag
          v-if="popoverRsvp"
          class="self-start"
          :value="popoverRsvp.text"
          :severity="popoverRsvp.severity"
          rounded
        />
      </div>
    </Popover>
  </div>
</template>

<style>
.lwp-calendar {
  --fc-border-color: var(--p-surface-200);
  --fc-today-bg-color: color-mix(in srgb, var(--p-primary-500) 8%, transparent);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: var(--p-surface-100);
  --fc-button-bg-color: var(--p-primary-500);
  --fc-button-border-color: var(--p-primary-500);
  --fc-button-hover-bg-color: var(--p-primary-600);
  --fc-button-hover-border-color: var(--p-primary-600);
  --fc-button-active-bg-color: var(--p-primary-700);
  --fc-button-active-border-color: var(--p-primary-700);
  --fc-now-indicator-color: #ea4335;
}

/* Today date number — filled primary circle */
.lwp-calendar .fc-day-today .fc-daygrid-day-number {
  background-color: var(--p-primary-500);
  color: #fff;
  border-radius: 50%;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* Google-style filled event blocks across all views */
.lwp-calendar .fc-event,
.lwp-calendar .fc-daygrid-event,
.lwp-calendar .fc-timegrid-event {
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition:
    box-shadow 0.12s ease,
    transform 0.12s ease,
    filter 0.12s ease;
}

.lwp-calendar .fc-event:hover {
  filter: brightness(0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  transform: translateY(-1px);
}

.lwp-calendar .fc-event-main,
.lwp-calendar .fc-event-title,
.lwp-calendar .fc-event-time {
  color: #fff;
}

/* Month view — compact filled bar */
.lwp-calendar .fc-daygrid-event {
  margin: 1px 4px;
  line-height: 1.2;
}

.lwp-calendar .fc-daygrid-event .fc-event-time {
  font-weight: 600;
  margin-right: 4px;
}

/* Hide the default colored dot in month view (we're using filled blocks instead) */
.lwp-calendar .fc-daygrid-event-dot {
  display: none;
}

/* Week / Day view — taller blocks with title and time */
.lwp-calendar .fc-timegrid-event .fc-event-main {
  padding: 2px 4px;
}

.lwp-calendar .fc-timegrid-event .fc-event-time {
  font-size: 0.72rem;
  opacity: 0.95;
}

.lwp-calendar .fc-timegrid-event .fc-event-title {
  font-weight: 600;
}

/* Now indicator — Google's red line */
.lwp-calendar .fc-timegrid-now-indicator-line {
  border-color: var(--fc-now-indicator-color);
  border-width: 2px 0 0;
}

.lwp-calendar .fc-timegrid-now-indicator-arrow {
  border-color: var(--fc-now-indicator-color);
  border-width: 5px 0 5px 6px;
}

/* RSVP badge inside event blocks */
.lwp-calendar .rsvp-badge {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  line-height: 1.4;
}

.lwp-calendar .rsvp-badge.rsvp-full {
  background: #dc2626;
}

/* List view theming */
.lwp-calendar .fc-list {
  border-color: var(--fc-border-color);
}

.lwp-calendar .fc-list-day-cushion {
  background: var(--fc-neutral-bg-color);
}

.lwp-calendar .fc-list-event:hover td {
  background: color-mix(in srgb, var(--p-primary-500) 8%, transparent);
}

.lwp-calendar .fc-list-event-dot {
  border-color: currentColor;
}

.lwp-calendar .fc-list-empty {
  background: transparent;
}

/* ---------- Toolbar — ghost nav buttons, segmented view switcher ---------- */
.lwp-calendar .fc-toolbar.fc-header-toolbar {
  margin-bottom: 1.25rem;
}

.lwp-calendar .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.lwp-calendar .fc .fc-button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--p-surface-600);
  box-shadow: none;
  font-weight: 500;
  font-size: 0.85rem;
  text-transform: capitalize;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.lwp-calendar .fc .fc-button:hover {
  background: var(--p-surface-100);
  color: var(--p-surface-800);
}

.lwp-calendar .fc .fc-button:focus,
.lwp-calendar .fc .fc-button:focus-visible {
  box-shadow: none;
  outline: none;
}

/* Group view-switch buttons into a segmented control */
.lwp-calendar .fc .fc-button-group {
  background: var(--p-surface-100);
  border-radius: 10px;
  padding: 2px;
  gap: 2px;
}

.lwp-calendar .fc .fc-button-group .fc-button {
  border-radius: 8px;
}

.lwp-calendar .fc .fc-button-group .fc-button:hover {
  background: var(--p-surface-200);
}

/* Active view — filled primary */
.lwp-calendar .fc .fc-button-primary:not(:disabled).fc-button-active,
.lwp-calendar .fc .fc-button-primary:not(:disabled):active {
  background: var(--p-primary-500);
  border-color: var(--p-primary-500);
  color: #fff;
}

.lwp-calendar .fc .fc-button-primary:disabled {
  background: transparent;
  border-color: transparent;
  color: var(--p-surface-300);
  opacity: 1;
}

/* ---------- Weekday header cells ---------- */
.lwp-calendar .fc-col-header-cell-cushion {
  display: inline-block;
  padding: 8px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-surface-400);
}

/* ---------- Month grid — weekend tint + other-month dimming ---------- */
.lwp-calendar .fc-daygrid-day.fc-day-sat,
.lwp-calendar .fc-daygrid-day.fc-day-sun {
  background: color-mix(in srgb, var(--p-surface-100) 55%, transparent);
}

.lwp-calendar .fc-daygrid-day.fc-day-other {
  background: color-mix(in srgb, var(--p-surface-100) 30%, transparent);
}

.lwp-calendar .fc-day-other .fc-daygrid-day-number {
  opacity: 0.4;
}

/* ---------- "+N more" link & day popover ---------- */
.lwp-calendar .fc-daygrid-more-link {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-primary-500);
  padding: 1px 4px;
}

.lwp-calendar .fc-daygrid-more-link:hover {
  background: color-mix(in srgb, var(--p-primary-500) 10%, transparent);
  border-radius: 4px;
}

.lwp-calendar .fc-popover {
  border-radius: 10px;
  border: 1px solid var(--fc-border-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.lwp-calendar .fc-popover-header {
  background: var(--fc-neutral-bg-color);
  padding: 6px 10px;
  font-weight: 600;
  font-size: 0.8rem;
}

/* ---------- Time grid — softer lines + business-hours shading ---------- */
.lwp-calendar .fc-timegrid-slot {
  height: 2.6em;
}

.lwp-calendar .fc-timegrid-slot-minor {
  border-top-style: none;
}

.lwp-calendar .fc-non-business {
  background: color-mix(in srgb, var(--p-surface-100) 55%, transparent);
}

.dark .lwp-calendar {
  --fc-border-color: var(--p-surface-700);
  --fc-today-bg-color: color-mix(in srgb, var(--p-primary-400) 12%, transparent);
  --fc-neutral-bg-color: var(--p-surface-800);
}

.dark .lwp-calendar .fc-scrollgrid,
.dark .lwp-calendar .fc-col-header-cell,
.dark .lwp-calendar .fc-daygrid-day,
.dark .lwp-calendar .fc-timegrid-slot {
  background-color: var(--p-surface-900);
}

.dark .lwp-calendar .fc-col-header-cell-cushion,
.dark .lwp-calendar .fc-daygrid-day-number,
.dark .lwp-calendar .fc-timegrid-slot-label-cushion,
.dark .lwp-calendar .fc-toolbar-title {
  color: var(--p-surface-200);
}

.dark .lwp-calendar .fc-list,
.dark .lwp-calendar .fc-list-table td {
  background: var(--p-surface-900);
  color: var(--p-surface-200);
  border-color: var(--p-surface-700);
}

.dark .lwp-calendar .fc-list-day-cushion {
  background: var(--p-surface-800);
}

.dark .lwp-calendar .fc-list-event:hover td {
  background: color-mix(in srgb, var(--p-primary-400) 12%, transparent);
}

/* ---------- Dark-mode polish variants ---------- */
.dark .lwp-calendar .fc .fc-button {
  color: var(--p-surface-300);
}

.dark .lwp-calendar .fc .fc-button:hover {
  background: var(--p-surface-800);
  color: var(--p-surface-100);
}

.dark .lwp-calendar .fc .fc-button-group {
  background: var(--p-surface-800);
}

.dark .lwp-calendar .fc .fc-button-group .fc-button:hover {
  background: var(--p-surface-700);
}

.dark .lwp-calendar .fc .fc-button-primary:disabled {
  color: var(--p-surface-600);
}

.dark .lwp-calendar .fc-col-header-cell-cushion {
  color: var(--p-surface-500);
}

.dark .lwp-calendar .fc-daygrid-day.fc-day-sat,
.dark .lwp-calendar .fc-daygrid-day.fc-day-sun {
  background-color: color-mix(in srgb, var(--p-surface-800) 45%, var(--p-surface-900));
}

.dark .lwp-calendar .fc-daygrid-day.fc-day-other {
  background-color: color-mix(in srgb, var(--p-surface-800) 30%, var(--p-surface-900));
}

.dark .lwp-calendar .fc-non-business {
  background: color-mix(in srgb, var(--p-surface-800) 40%, transparent);
}

.dark .lwp-calendar .fc-popover,
.dark .lwp-calendar .fc-popover-body {
  background: var(--p-surface-900);
  color: var(--p-surface-200);
}

.dark .lwp-calendar .fc-popover-header {
  background: var(--p-surface-800);
  color: var(--p-surface-200);
}
</style>
