<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah } from '@/utils/format'
import { toSearchQuery } from '@/utils/search'

const props = defineProps({
  room: { type: Object, required: true },
  search: { type: Object, default: () => ({}) },
  nights: { type: Number, default: 0 },
  variant: { type: String, default: 'search' }, // search | detail
  showDetail: Boolean, // tombol Detail (membuka modal detail kamar)
  disabledReason: { type: String, default: '' }, // terisi = tombol Pesan nonaktif
})
const emit = defineEmits(['detail', 'book'])

const total = computed(() => props.room.totalPrice ?? (props.nights ? props.room.pricePerNight * props.nights : null))
const nightsCount = computed(() => props.room.nights ?? props.nights)
const available = computed(() => props.room.available !== false)
const query = computed(() => toSearchQuery(props.search))
</script>

<template>
  <article class="rounded-2xl border border-line bg-surface p-5 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-xl font-bold text-ink">{{ room.name }}</h3>
          <span v-if="room.type" class="rounded-full bg-neutral-bg px-3 py-1 text-xs font-semibold text-neutral-fg">{{ roomTypeLabel(room.type) }}</span>
        </div>
        <p class="mt-1 text-sm text-muted">
          <template v-if="variant === 'search' && room.homestay">
            <RouterLink :to="{ name: 'homestay-detail', params: { id: room.homestay.id }, query }" class="hover:text-primary hover:underline">{{ room.homestay.name }}</RouterLink>
            <span v-if="room.capacity"> · </span>
          </template>
          <template v-if="room.capacity">maks {{ room.capacity }} tamu</template>
        </p>
        <p v-if="room.description" class="mt-2 text-ink">{{ room.description }}</p>
      </div>

      <div class="shrink-0 sm:text-right">
        <template v-if="variant === 'search'">
          <p class="text-sm text-muted">{{ formatRupiah(room.pricePerNight) }} / malam</p>
          <p v-if="total != null" class="text-2xl font-bold text-ink">{{ formatRupiah(total) }}</p>
        </template>
        <template v-else>
          <p class="text-2xl font-bold text-ink">
            {{ formatRupiah(room.pricePerNight) }} <span class="text-sm font-semibold text-muted">/ malam</span>
          </p>
          <p v-if="nights" :class="['text-sm', available ? 'text-muted' : 'text-bad-fg']">
            {{ available ? `Tersedia · ${formatRupiah(total)} (${nightsCount} malam)` : 'Tidak tersedia pada tanggal ini' }}
          </p>
          <p v-else class="text-sm text-muted">Pilih tanggal untuk melihat ketersediaan.</p>
        </template>
        <div class="mt-3 flex flex-wrap gap-2 sm:justify-end">
          <BaseButton v-if="showDetail" variant="outline" size="sm" @click="emit('detail', room)">Detail</BaseButton>
          <BaseButton size="sm" :disabled="!!disabledReason" :title="disabledReason" @click="emit('book', room)">Pesan</BaseButton>
        </div>
      </div>
    </div>
  </article>
</template>
