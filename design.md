# Apple-Style Design System — design.md

Panduan desain UI/UX bergaya Apple (apple.com) untuk web app. Gunakan file ini sebagai referensi/context saat coding di Antigravity atau AI coding assistant lain — paste seluruh isi file ini ke prompt sebelum minta generate komponen/halaman.

---

## 1. Filosofi Desain

Prinsip inti gaya Apple:

- **Clarity over decoration** — Setiap elemen punya alasan untuk ada. Tidak ada ornamen yang tidak fungsional.
- **Konten adalah hero** — Produk/pesan utama tampil besar, dominan, dikelilingi whitespace luas. Bukan UI yang penuh sesak.
- **Depth melalui layer, bukan bayangan berat** — Blur, transparansi (glassmorphism), dan subtle shadow, bukan drop-shadow tebal ala Material lama.
- **Motion punya tujuan** — Animasi menjelaskan hubungan sebab-akibat (tap ini → muncul itu), bukan sekadar hiasan.
- **Precision di detail kecil** — Spacing, alignment, dan easing curve konsisten sampai ke pixel. Ini yang bikin sesuatu "terasa mahal".

---

## 2. Warna

Palet netral dominan, aksen warna dipakai sangat hemat (biasanya cuma 1 aksen per section).

```css
:root {
  /* Base */
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f7;      /* khas section background Apple */
  --color-bg-dark: #000000;
  --color-bg-dark-secondary: #1d1d1f;

  /* Text */
  --color-text-primary: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-text-on-dark: #f5f5f7;
  --color-text-on-dark-secondary: #a1a1a6;

  /* Accent — pilih 1 sesuai brand, jangan semua sekaligus */
  --color-accent-blue: #0071e3;       /* CTA / link khas Apple */
  --color-accent-blue-hover: #0077ed;

  /* Glass / surfaces */
  --color-glass: rgba(255, 255, 255, 0.72);
  --color-glass-dark: rgba(29, 29, 31, 0.72);
  --color-border-hairline: rgba(0, 0, 0, 0.08);
  --color-border-hairline-dark: rgba(255, 255, 255, 0.12);
}
```

Aturan pakai:
- Background utama putih atau `#f5f5f7`, section gelap `#000` untuk produk premium/dramatis (mis. hero produk baru).
- Aksen biru (`#0071e3`) hanya untuk CTA utama dan link — jangan dipakai untuk elemen dekoratif.
- Teks sekunder `#6e6e73` untuk subheading/caption, bukan abu-abu random.

---

## 3. Tipografi

Apple pakai **SF Pro**, tapi itu font berlisensi. Untuk web app, gunakan alternatif yang sangat mirip:

- **Utama:** `Inter` atau `"SF Pro Display", -apple-system, BlinkMacSystemFont` (fallback ke system font Apple otomatis di device Apple).
- **Alternatif dekat:** `General Sans`, `Geist Sans`.

```css
:root {
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
  --font-text: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
}

.hero-headline {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;   /* tight tracking khas Apple */
  line-height: 1.05;
}

.body-text {
  font-family: var(--font-text);
  font-size: clamp(1rem, 1.2vw, 1.25rem);
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
```

Aturan pakai:
- Headline besar, bold (weight 600–700), **letter-spacing negatif** — ini ciri khas paling gampang dikenali.
- Jangan pernah pakai lebih dari 2 font family dalam 1 halaman.
- Ukuran headline pakai `clamp()` supaya scale otomatis di semua device.

---

## 4. Spacing & Layout

Grid lebar, section besar, whitespace generous.

```css
:root {
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 32px;
  --space-lg: 64px;
  --space-xl: 120px;   /* jarak antar section, khas Apple */
  --space-2xl: 180px;

  --container-max: 1200px;
  --radius-card: 18px;      /* rounded corner khas Apple, bukan tajam bukan pill */
  --radius-button: 980px;   /* pill button */
}

.section {
  padding-block: var(--space-xl);
}

.container {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--space-md);
}
```

Aturan pakai:
- 1 section = 1 pesan. Jangan gabung banyak fitur dalam satu section padat.
- Card pakai `border-radius: 18px`, button CTA pakai pill (`border-radius: 980px`).
- Beri jarak vertikal besar antar section (`120px+`) — ini yang bikin halaman "bernafas".

---

## 5. Sistem Animasi (Motion)

### 5.1 Easing curve

Apple selalu pakai easing custom, bukan `ease` atau `linear` default browser.

```css
:root {
  --ease-apple: cubic-bezier(0.28, 0.11, 0.32, 1);   /* signature Apple easing */
  --ease-out-quick: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  --duration-fast: 200ms;
  --duration-base: 400ms;
  --duration-slow: 700ms;
  --duration-hero: 1000ms;
}
```

### 5.2 Scroll-reveal (fade + rise)

Elemen muncul dari bawah dengan fade saat masuk viewport — pola paling ikonik di apple.com.

```css
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity var(--duration-slow) var(--ease-apple),
              transform var(--duration-slow) var(--ease-apple);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

```js
// Intersection Observer sederhana
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // animasi 1x saja
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

### 5.3 Sticky scroll pinning (produk "menempel" saat di-scroll)

Pola khas halaman produk Apple: gambar/video pin di tengah layar sambil teks berganti-ganti saat user scroll.

```css
.pin-section {
  height: 300vh; /* tinggi total = jumlah "step" x 100vh */
  position: relative;
}
.pin-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```
Kontrol progress teks/gambar berdasar `scrollY` dibagi tinggi section (bisa pakai Framer Motion `useScroll` + `useTransform` kalau React).

### 5.4 Hover micro-interaction

```css
.apple-button {
  background: var(--color-accent-blue);
  color: white;
  border-radius: var(--radius-button);
  padding: 12px 24px;
  transition: background var(--duration-fast) var(--ease-out-quick),
              transform var(--duration-fast) var(--ease-out-quick);
}
.apple-button:hover {
  background: var(--color-accent-blue-hover);
  transform: scale(1.02);
}
.apple-button:active {
  transform: scale(0.98);
}
```

Card hover — subtle lift, bukan shadow tebal:

```css
.apple-card {
  transition: transform var(--duration-base) var(--ease-apple),
              box-shadow var(--duration-base) var(--ease-apple);
}
.apple-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}
```

### 5.5 Glassmorphism (navbar/tab bar mengambang)

```css
.glass-nav {
  background: var(--color-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-border-hairline);
}
```

### 5.6 Text reveal per kata/huruf (hero headline)

Untuk headline hero yang ingin muncul kata-per-kata (pakai Framer Motion di React):

```jsx
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const word = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.28, 0.11, 0.32, 1] } },
};

function HeroHeadline({ text }) {
  return (
    <motion.h1 variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3em' }}>
      {text.split(' ').map((w, i) => (
        <motion.span key={i} variants={word}>{w}</motion.span>
      ))}
    </motion.h1>
  );
}
```

### 5.7 Page/route transition (kalau pakai Next.js / SPA)

```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ duration: 0.5, ease: [0.28, 0.11, 0.32, 1] }}
>
  {children}
</motion.div>
```

### 5.8 Reduced motion (wajib)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Pola Komponen Umum

| Komponen | Ciri khas Apple |
|---|---|
| Navbar | Fixed, glass blur, hairline border bawah, font kecil (14px), menu items rapat |
| Hero | Headline besar center, subcopy tipis, 1–2 CTA pill button, produk/visual di bawahnya |
| Section produk | Alternating dark/light background per section, full-bleed image/video |
| Card grid | 2–3 kolom, radius besar (18px), padding besar, hover lift halus |
| CTA button | Pill shape, warna solid biru atau outline putih di dark bg |
| Footer | Padat, multi-kolom kecil, font 12px, warna abu-abu muted |

---

## 7. Checklist Sebelum Deploy

- [ ] Semua headline pakai letter-spacing negatif & font weight 600+
- [ ] Tidak ada shadow tebal/hitam pekat — pakai soft shadow rgba rendah opacity
- [ ] Semua animasi scroll pakai `IntersectionObserver` / `useScroll`, 1x trigger (`unobserve` setelah muncul)
- [ ] Easing custom (`cubic-bezier`) dipakai di semua transition, bukan `ease` default
- [ ] `prefers-reduced-motion` sudah di-handle
- [ ] Section spacing vertikal minimal 80–120px
- [ ] Maksimal 1 warna aksen dominan per halaman
- [ ] Responsive: headline pakai `clamp()`, bukan breakpoint manual bertingkat-tingkat

---

## 8. Cara Pakai File Ini

Saat mulai project baru di Antigravity, paste prompt seperti ini:

> "Ikuti design system di design.md ini untuk styling seluruh app: [paste isi file]. Terapkan warna, tipografi, spacing, dan animasi sesuai panduan di atas."

File ini bisa dipakai berulang untuk semua project web app (termasuk Siger Taekwondo Club Manager) supaya konsisten bergaya Apple.
