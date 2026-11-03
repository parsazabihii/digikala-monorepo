# راهنمای تحویل پروژه دیجی‌کالا

> این مخزن یک پروژه آموزشی و فرضی است و معماری واقعی دیجی‌کالا را بازنمایی نمی‌کند.

## محدوده انجام‌شده

- مونوریپو با `pnpm workspaces` و Turborepo
- سه اپ مستقل:
  - `frontend`: Next.js روی پورت 3000
  - `admin`: React + Vite روی پورت 5173 در توسعه و 4173 در اجرای production
  - `backend`: NestJS + Fastify روی پورت 4000
- TypeScript strict و ESLint type-aware برای هر اپ
- Prettier، Husky، lint-staged و commitlint
- Conventional Commits
- مدیریت پیکربندی بک‌اند با `@nestjs/config` و اعتبارسنجی Zod
- قرارداد HTTP با `/api/v1` و مسیر مستقل `/health`
- CORS، `trustProxy` و محدودیت اندازه body
- قالب یکپارچه خطا و validation pipe مبتنی بر Zod
- لاگ ساختاریافته Pino، مخفی‌سازی هدرهای حساس و `x-request-id`
- تست‌های unit و e2e بک‌اند
- ADRهای فارسی در `DECISIONS.md`
- پرامپت‌های مرحله‌ای در `prompts/`
- تحلیل دامنه در `DOMAIN.md` و نمودار در `docs/system-design.png`

## بررسی‌های انجام‌شده

در محیط ساخت، موارد زیر برای هر سه اپ مستقل اجرا و موفق شدند:

- lint
- typecheck
- test
- build

نتیجه تست بک‌اند:

- 13 تست unit موفق
- 14 تست e2e موفق
- در مجموع 27 تست موفق

اجرای فرمان‌های root مبتنی بر Turbo در محیط ساخت به‌دلیل پیدا نشدن binary مربوط به pnpm از داخل Corepack میزبان ممکن نبود؛ این یک محدودیت محیط اجرا بود. خود اپ‌ها با همان lockfile و وابستگی‌ها به‌صورت مستقل با موفقیت بررسی شدند. پروژه طبق `.nvmrc` به Node.js 24 نیاز دارد.

## اجرای پروژه

```sh
nvm use
corepack enable pnpm
pnpm install
pnpm dev
```

آدرس‌ها:

- Frontend: <http://localhost:3000>
- Admin: <http://localhost:5173>
- Backend health: <http://localhost:4000/health>

## کنترل کیفیت پیش از تحویل

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter backend test:e2e
pnpm build
```

## قانون کار با AI و کامیت

طبق `CLAUDE.md`:

1. هر پرامپت دقیقاً یک تغییر منطقی دارد.
2. تغییر قبل از کامیت توسط مالک پروژه بررسی می‌شود.
3. پس از تأیید، فقط یک کامیت Conventional Commit ساخته می‌شود.
4. پیام کامیت شامل `Co-Authored-By` نیست.
5. تصمیم معماری ابتدا به‌صورت ADR پیشنهادی ثبت و جداگانه بررسی می‌شود.

نمونه پیام‌ها:

```text
chore(repo): scaffold digikala monorepo
feat(backend): use fastify adapter
feat(backend): validate environment configuration
feat(backend): establish HTTP conventions
feat(backend): standardize validation and errors
feat(backend): add structured request logging
```

## انتشار در GitHub

پس از بازکردن پروژه و بررسی شخصی کدها:

```sh
git init
git add .
git commit -m "chore(repo): scaffold digikala monorepo"
git branch -M main
git remote add origin https://github.com/<USERNAME>/digikala-monorepo.git
git push -u origin main
```

تاریخچه کامیت نمونه بلوبانک جعل یا کپی نشده است. برای رعایت قانون «یک پرامپت، یک ریویو، یک کامیت»، کامیت نهایی باید فقط پس از بررسی شما ساخته شود.

## مرحله بعدی

در فایل مرجع ارائه‌شده هیچ کد یا پرامپتی برای ماژول `Enrollments` وجود نداشت و پروژه تا زیرساخت پیش از اولین feature دامنه ادامه داشت. بنابراین ماژول فروشگاهی حدس زده نشده است. پس از دریافت چهار پرامپت یا الزامات دقیق Enrollments می‌توان معادل دامنه‌ای مناسب آن (برای مثال catalog یا products) را مرحله‌به‌مرحله و با تست پیاده‌سازی کرد.
