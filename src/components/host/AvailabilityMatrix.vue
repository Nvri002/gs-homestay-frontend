<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { CALENDAR_STATUS } from '@/utils/statusMap'
import { currentMonth, daysInMonth, todayISO } from '@/utils/format'
import { roomTypeLabel } from '@/utils/constants'

// rooms: [{ room, homestayName, roomType, status, dates: { 'YYYY-MM-DD': { status, bookingId, guestName } } }]
const props = defineProps({ rooms: { type: Array, required: true }, month: { type: String, required: true } })
const emit = defineEmits(['select']) // booking id

const days = computed(() => Array.from({ length: daysInMonth(props.month) }, (_, i) => i + 1))
const today = todayISO()
const base = 'grid size-8 place-items-center rounded-md text-xs font-bold'

const scroller = ref(null)

// Pada bulan berjalan, geser kalender agar kolom hari ini terlihat (penting di layar ponsel).
function scrollToToday() {
  const box = scroller.value
  if (!box || props.month !== currentMonth()) return
  const th = box.querySelector('[data-today]')
  if (!th) return
  const stickyWidth = box.querySelector('th[scope="col"]')?.offsetWidth || 0
  box.scrollLeft = Math.max(0, th.offsetLeft - stickyWidth - 8)
}
onMounted(() => nextTick(scrollToToday))
watch(() => props.month, () => nextTick(scrollToToday))

const iso = (d) => `${props.month}-${String(d).padStart(2, '0')}`
const cellOf = (room, d) => room.dates[iso(d)] || null
const metaOf = (c) => (c ? CALENDAR_STATUS[c.status] || { label: c.status, cell: 'bg-neutral-bg text-neutral-fg', mark: '?' } : null)
function label(room, d) {
  const c = cellOf(room, d)
  const m = metaOf(c)
  return `${room.room}, tanggal ${d}: ${m ? m.label : 'tidak ada data'}${c?.guestName ? `, tamu ${c.guestName}` : ''}`
}
const ring = (d) => (iso(d) === today ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : '')
</script>

<template>
  <div>
    <p class="mb-2 text-xs text-muted sm:hidden">Geser kalender ke samping untuk melihat seluruh tanggal.</p>
    <div ref="scroller" class="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-surface" tabindex="0" role="region" aria-label="Kalender ketersediaan kamar (dapat digulir ke samping)">
    <table class="min-w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr>
          <th scope="col" class="sticky left-0 z-10 min-w-44 border-b border-line bg-surface px-4 py-3 text-left font-semibold text-ink">Kamar</th>
          <th v-for="d in days" :key="d" scope="col" :data-today="iso(d) === today ? '' : undefined" :class="['border-b border-line px-0.5 py-3 text-center text-xs font-medium', iso(d) === today ? 'text-primary' : 'text-muted']">{{ d }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rooms" :key="r.roomId">
          <th scope="row" class="sticky left-0 z-10 border-b border-line bg-surface px-4 py-2 text-left font-normal">
            <p class="font-semibold text-ink">{{ r.room }}</p>
            <p class="text-xs text-muted">{{ r.homestayName }}<template v-if="r.roomType"> · {{ roomTypeLabel(r.roomType) }}</template></p>
            <StatusBadge v-if="r.status === 'nonaktif'" status="nonaktif" class="mt-1 !px-2 !py-0.5 !text-xs" />
          </th>
          <td v-for="d in days" :key="d" class="border-b border-line px-0.5 py-1.5">
            <button
              v-if="cellOf(r, d)?.bookingId"
              type="button"
              :class="[base, metaOf(cellOf(r, d)).cell, ring(d), 'cursor-pointer transition hover:opacity-75']"
              :title="label(r, d)"
              :aria-label="label(r, d)"
              @click="emit('select', cellOf(r, d).bookingId)"
            >
              {{ metaOf(cellOf(r, d)).mark }}
            </button>
            <div v-else :class="[base, metaOf(cellOf(r, d))?.cell || 'border border-dashed border-line text-muted', ring(d)]" role="img" :title="label(r, d)" :aria-label="label(r, d)">
              {{ metaOf(cellOf(r, d))?.mark }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>
