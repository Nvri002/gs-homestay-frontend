<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ImageWithFallback from '@/components/common/ImageWithFallback.vue'
import { roomTypeLabel } from '@/utils/constants'
import { formatRupiah } from '@/utils/format'

const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  room: { type: Object, default: null },
  nights: { type: Number, default: 0 },
  disabledReason: { type: String, default: '' },
})
const emit = defineEmits(['book'])

const active = ref(0)
watch(() => props.room?.id, () => (active.value = 0))

const total = computed(() => props.room?.totalPrice ?? (props.nights ? props.room.pricePerNight * props.nights : null))
</script>

<template>
  <BaseModal v-if="room" v-model="open" :title="room.name" size="lg">
    <div class="aspect-video overflow-hidden rounded-xl border border-line">
      <ImageWithFallback :src="room.photos[active]" :alt="room.name" />
    </div>
    <div v-if="room.photos.length > 1" class="mt-3 flex gap-2 overflow-x-auto">
      <button
        v-for="(p, i) in room.photos"
        :key="p"
        type="button"
        :class="['size-16 shrink-0 overflow-hidden rounded-lg border-2', i === active ? 'border-primary' : 'border-transparent']"
        :aria-label="`Foto ${i + 1}`"
        @click="active = i"
      >
        <ImageWithFallback :src="p" :alt="`Foto ${i + 1}`" />
      </button>
    </div>

    <dl class="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      <div><dt class="text-muted">Homestay</dt><dd class="font-semibold text-ink">{{ room.homestay?.name || '-' }}</dd></div>
      <div><dt class="text-muted">Tipe kamar</dt><dd class="font-semibold text-ink">{{ roomTypeLabel(room.type) || '-' }}</dd></div>
      <div><dt class="text-muted">Kapasitas</dt><dd class="font-semibold text-ink">{{ room.capacity ? `Maks ${room.capacity} tamu` : '-' }}</dd></div>
      <div><dt class="text-muted">Harga per malam</dt><dd class="font-semibold text-ink">{{ formatRupiah(room.pricePerNight) }}</dd></div>
    </dl>

    <p v-if="room.description" class="mt-4 text-ink">{{ room.description }}</p>

    <div v-if="room.facilities.length" class="mt-4">
      <p class="mb-2 text-sm font-semibold text-ink">Fasilitas</p>
      <ul class="flex flex-wrap gap-2">
        <li v-for="f in room.facilities" :key="f" class="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">{{ f }}</li>
      </ul>
    </div>

    <div v-if="total != null" class="mt-5 flex items-center justify-between rounded-xl border border-line bg-field px-4 py-3">
      <span class="text-muted">Estimasi total ({{ room.nights ?? nights }} malam)</span>
      <span class="text-xl font-bold text-primary">{{ formatRupiah(total) }}</span>
    </div>

    <template #footer>
      <BaseButton variant="outline" @click="open = false">Tutup</BaseButton>
      <BaseButton :disabled="!!disabledReason" :title="disabledReason" @click="emit('book', room)">Pesan</BaseButton>
    </template>
  </BaseModal>
</template>
