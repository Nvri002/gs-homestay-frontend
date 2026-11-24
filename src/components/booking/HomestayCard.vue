<script setup>
import ImageWithFallback from '@/components/common/ImageWithFallback.vue'
import { formatRupiah } from '@/utils/format'

defineProps({
  homestay: { type: Object, required: true },
  query: { type: Object, default: () => ({}) }, // parameter pencarian yang dibawa ke halaman detail
})
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
    <RouterLink :to="{ name: 'homestay-detail', params: { id: homestay.id }, query }" class="block aspect-[4/3] overflow-hidden" :aria-label="`Lihat ${homestay.name}`" tabindex="-1">
      <ImageWithFallback :src="homestay.photos[0]" :alt="homestay.name" />
    </RouterLink>
    <div class="flex flex-1 flex-col p-5">
      <h3 class="text-xl font-bold text-ink">
        <RouterLink :to="{ name: 'homestay-detail', params: { id: homestay.id }, query }" class="hover:text-primary">{{ homestay.name }}</RouterLink>
      </h3>
      <p class="mt-1 text-muted">{{ homestay.address }}</p>
      <p v-if="homestay.startingPrice != null" class="mt-3 text-ink">
        Mulai dari <strong>{{ formatRupiah(homestay.startingPrice) }}</strong> / malam
      </p>
      <div class="mt-auto pt-4">
        <RouterLink :to="{ name: 'homestay-detail', params: { id: homestay.id }, query }" class="inline-flex rounded-xl border border-primary px-4 py-2.5 font-semibold text-primary hover:bg-primary-soft">
          Lihat Homestay
        </RouterLink>
      </div>
    </div>
  </article>
</template>
