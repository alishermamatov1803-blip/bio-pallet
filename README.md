# BIO PALLET CRM

BIO PALLET firmasi uchun mijozlar, buyurtmalar, ombor va hisobotlarni boshqarish tizimi.

## Texnologiyalar

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma ORM + SQLite
- JWT asosidagi autentifikatsiya (httpOnly cookie)
- Recharts (grafiklar)

## Modullar

- **Mijozlar** — mijozlar bazasi, aloqa ma'lumotlari, buyurtmalar tarixi
- **Buyurtmalar** — buyurtma yaratish, mahsulotlarni tanlash, holatini kuzatish (Yangi → Tasdiqlangan → Ishlab chiqarilmoqda → Tayyor → Jo'natildi → Yakunlandi), to'lovlarni qayd etish
- **Ombor** — mahsulotlar (pallet turlari, xomashyo, xizmatlar), kirim/chiqim harakatlari, minimal zaxira ogohlantirishlari
- **Hisobotlar** — savdo statistikasi, oylik daromad grafigi, top mijozlar, kam qolgan mahsulotlar

## O'rnatish

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
```

Tizim http://localhost:3000 manzilida ishga tushadi.

### Standart login

```
Email: admin@biopallet.uz
Parol: admin123
```

**Muhim:** ishlab chiqarish (production) muhitida `.env` faylidagi `JWT_SECRET` qiymatini albatta o'zgartiring va standart admin parolini almashtiring.

## Loyihaning tuzilishi

```
prisma/schema.prisma      — ma'lumotlar bazasi sxemasi
prisma/seed.ts            — boshlang'ich ma'lumotlar (admin, namunaviy mijoz/mahsulot)
src/app/api/*             — REST API endpointlari
src/app/dashboard/*       — asosiy CRM sahifalari
src/app/login             — kirish sahifasi
src/lib/*                 — Prisma client, autentifikatsiya, formatlash yordamchilari
src/components/*          — umumiy UI komponentlari
```

## Skriptlar

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production serverni ishga tushirish
- `npm run seed` — bazani boshlang'ich ma'lumotlar bilan to'ldirish
- `npx prisma studio` — ma'lumotlar bazasini vizual ko'rish
