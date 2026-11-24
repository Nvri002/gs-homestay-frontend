<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import InfoRows from '@/components/common/InfoRows.vue'
import { useUiStore } from '@/stores/ui'
import { copyText } from '@/utils/clipboard'

// instruction: { bank, accountNumber, accountName } dari field payment_instruction API (tidak di-hardcode).
const props = defineProps({ instruction: { type: Object, default: null } })
const ui = useUiStore()

async function copy() {
  const ok = await copyText(props.instruction.accountNumber)
  ui.notify(ok ? 'Nomor rekening disalin.' : 'Gagal menyalin. Salin nomor secara manual.', ok ? 'success' : 'error', 2500)
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-5">
    <h3 class="font-bold text-ink">Instruksi Pembayaran (Simulasi)</h3>
    <template v-if="instruction">
      <InfoRows
        class="mt-3"
        :rows="[
          { label: 'Bank', value: instruction.bank },
          { label: 'Nomor rekening', value: instruction.accountNumber },
          { label: 'Atas nama', value: instruction.accountName },
        ]"
      />
      <BaseButton class="mt-4" variant="outline" size="sm" @click="copy">Salin nomor rekening</BaseButton>
    </template>
    <p v-else class="mt-2 text-muted">Instruksi pembayaran belum tersedia.</p>
  </div>
</template>
