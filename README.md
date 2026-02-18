#  Khatam Berdua

Challenge Ramadhan untuk khatam Al-Qur'an bersama pasangan dalam 30 hari.

## Konsep

- 2 peserta per challenge
- Target **10 halaman/orang/hari**
- Total gabungan **20 halaman/hari** (1 juz)
- Total target: **604 halaman** (1 mushaf lengkap)
- Durasi: **30 hari**

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (database only, no auth)
- Deployment: **Vercel**

## Getting Started

### 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka SQL Editor, jalankan script di `supabase/schema.sql`
3. Copy URL dan anon key dari project settings

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan Supabase credentials.

### 3. Install & Run

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 4. Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel dashboard
4. Deploy!
