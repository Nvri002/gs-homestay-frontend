<script setup>
import { computed, reactive, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { FACILITY_OPTIONS, ROOM_TYPES } from '@/utils/constants'

// modelValue: { room_type, min_price, max_price, facilities[] } (dari query URL)
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['apply', 'reset'])

const draft = reactive({ room_type: '', min_price: '', max_price: '', facilities: [] })

watch(
  () => props.modelValue,
  (v) => {
    draft.room_type = v.room_type || ''
    draft.min_price = v.min_price || ''
    draft.max_price = v.max_price || ''
    draft.facilities = [...(v.facilities || [])]
  },
  { immediate: true, deep: true },
)

const priceError = computed(() =>
  draft.min_price !== '' && draft.max_price !== '' && Number(draft.min_price) > Number(draft.max_price)
    ? 'Harga minimum tidak boleh melebihi harga maksimal.'
    : '',
)

function apply() {
  if (priceError.value) return
  emit('apply', { ...draft, facilities: [...draft.facilities] })
}
</script>

<template>
  <form class="rounded-2xl border border-line bg-surface p-5 sm:p-6" @submit.prevent="apply">
    <div class="grid gap-4 sm:grid-cols-3">
      <BaseSelect v-model="draft.room_type" label="Tipe kamar" placeholder="Semua tipe" :options="ROOM_TYPES" />
      <BaseInput v-model="draft.min_price" type="number" label="Harga minimum / malam" min="0" placeholder="Tanpa batas" />
      <BaseInput v-model="draft.max_price" type="number" label="Harga maksimal / malam" min="0" placeholder="Tanpa batas" :error="priceError" />
    </div>
    <fieldset class="mt-4">
      <legend class="mb-2 text-sm font-semibold text-ink">Fasilitas</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="f in FACILITY_OPTIONS"
          :key="f"
          :class="['cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition', draft.facilities.includes(f) ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-field']"
        >
          <input v-model="draft.facilities" type="checkbox" :value="f" class="sr-only" />
          {{ f }}
        </label>
      </div>
    </fieldset>
    <div class="mt-5 flex flex-wrap gap-3">
      <BaseButton type="submit" size="sm">Terapkan filter</BaseButton>
      <BaseButton variant="outline" size="sm" @click="emit('reset')">Reset</BaseButton>
    </div>
  </form>
</template>
