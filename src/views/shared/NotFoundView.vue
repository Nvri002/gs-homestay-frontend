<template>
  <section class="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
    <h1 class="text-3xl font-bold text-ink">Halaman tidak ditemukan</h1>
    <p class="mt-3 text-muted">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
    <RouterLink :to="{ name: 'beranda' }" class="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary hover:bg-primary-hover">
      Kembali ke beranda
    </RouterLink>
  </section>
</template>
