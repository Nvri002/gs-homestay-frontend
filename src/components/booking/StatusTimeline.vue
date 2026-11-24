<script setup>
defineProps({ steps: { type: Array, required: true } }) // [{ label, sub, state }]

const dot = {
  done: 'border-primary bg-primary',
  current: 'border-primary bg-surface',
  pending: 'border-muted bg-surface',
  bad: 'border-bad-fg bg-bad-fg',
}
const label = {
  done: 'text-ink',
  current: 'font-semibold text-ink',
  pending: 'text-muted',
  bad: 'font-semibold text-bad-fg',
}
</script>

<template>
  <ol class="space-y-5">
    <li v-for="(s, i) in steps" :key="i" class="flex gap-3" :aria-current="s.state === 'current' ? 'step' : undefined">
      <span :class="['mt-1.5 size-3.5 shrink-0 rounded-full border-2', dot[s.state]]" />
      <div>
        <p :class="label[s.state]">{{ s.label }}</p>
        <p v-if="s.sub" class="text-sm text-muted">{{ s.sub }}</p>
      </div>
    </li>
  </ol>
</template>
