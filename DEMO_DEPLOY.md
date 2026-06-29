# Demo Deploy

Bu proje iki parcadan olusuyor:

- `backend`: Django REST API, Railway uzerinde calisir.
- `frontend`: Next.js site, Vercel uzerinde calisir.

Production demo hedefleri:

- Backend URL: `https://e-commerce-production-cb7b.up.railway.app`
- API Base URL: `https://e-commerce-production-cb7b.up.railway.app/api`
- Iyzico callback backend uzerinde kalir.
- Kullanici odeme sonucunda frontend `/payment-result` sayfasina doner.

## Railway Backend Env

Railway backend servisinde gerekli env degerleri:

```env
DJANGO_SECRET_KEY=uzun-rastgele-bir-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=e-commerce-production-cb7b.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
FRONTEND_BASE_URL=https://your-vercel-domain.vercel.app
DATABASE_URL=postgresql://...
IYZICO_API_KEY=sandbox-api-key
IYZICO_SECRET_KEY=sandbox-secret-key
IYZICO_BASE_URL=sandbox-api.iyzipay.com
DJANGO_TIME_ZONE=Europe/Istanbul
API_PAGE_SIZE=12
```

`CSRF_TRUSTED_ORIGINS` ayri env olarak okunmuyor; backend kodu `CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS` kullaniyor.

## Railway Backend Commands

Build command:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_store
```

Start command:

```bash
gunicorn config.wsgi:application
```

Health check:

```txt
https://e-commerce-production-cb7b.up.railway.app/api/health/
```

## Vercel Frontend

Vercel'de `frontend` klasorunu project root sec.

Build command:

```bash
npm run build
```

Vercel environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://e-commerce-production-cb7b.up.railway.app/api
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

## Iyzico Test

Kartla odeme secilirse backend iyzico Checkout Form oturumu acar ve frontend kullaniciyi iyzico sandbox odeme sayfasina gonderir.

Callback URL backend uzerinden otomatik uretilir:

```txt
https://e-commerce-production-cb7b.up.railway.app/api/payments/iyzico/callback/
```

Sandbox test karti:

```txt
Kart: 5528790000000008
SKT: gelecekteki herhangi bir ay/yil
CVC: 123
3D sifre gerekiyorsa: 123456
```

## Demo Users

Seed command sonrasi demo hesaplari:

- Admin: `yonetici / 123456`
- Customer: `musteri / 123456`

## Not

Yeni urun fotografi upload edilirse dosya backend instance diskinde kalir. Kalici demo icin Cloudinary/S3 gibi external media storage eklemek gerekir. Siparis, kayit ve urun verileri Postgres'te kalicidir.
