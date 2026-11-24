import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'gsh_booking_draft'

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

// Draft pemesanan antar langkah (Data -> Ringkasan). Disimpan di sessionStorage agar refresh tidak menghilangkannya.
export const useBookingDraftStore = defineStore('bookingDraft', () => {
  const draft = ref(read())

  function setDraft(value) {
    draft.value = value
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      /* penyimpanan penuh/nonaktif: abaikan */
    }
  }

  function clear() {
    draft.value = null
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* abaikan */
    }
  }

  return { draft, setDraft, clear }
})
