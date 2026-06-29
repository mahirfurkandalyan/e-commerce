# Demo Deploy

Bu proje iki parçadan oluşuyor:

- `backend`: Django REST API
- `frontend`: Next.js site

Demo link için önerilen kurulum:

1. Backend ve Postgres'i Render veya Railway gibi bir servise deploy et.
2. Frontend'i Vercel'e deploy et.
3. Vercel'de `NEXT_PUBLIC_API_BASE_URL` değerini backend URL'inin `/api` endpoint'i olarak gir.

## Backend Env

Backend servisinde gerekli env değerleri:

```env
DJANGO_SECRET_KEY=uzun-rastgele-bir-secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=backend-domain.example.com
CORS_ALLOWED_ORIGINS=https://frontend-domain.example.com
CSRF_TRUSTED_ORIGINS=https://frontend-domain.example.com
DATABASE_URL=postgresql://...
FRONTEND_BASE_URL=https://frontend-domain.example.com
IYZICO_API_KEY=sandbox-api-key
IYZICO_SECRET_KEY=sandbox-secret-key
IYZICO_BASE_URL=sandbox-api.iyzipay.com
```

Render/Railway Postgres kullanıyorsan çoğu zaman `DATABASE_URL` otomatik verilir.

## Backend Commands

Build command:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_store
```

Start command:

```bash
gunicorn config.wsgi:application
```

## Frontend Env

Vercel'de `frontend` klasörünü root seç ve şu env değerini gir:

```env
NEXT_PUBLIC_API_BASE_URL=https://backend-domain.example.com/api
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

## Iyzico Test

Kartla odeme secilirse backend iyzico Checkout Form oturumu acar ve frontend kullaniciyi iyzico sandbox odeme sayfasina gonderir. Iyzico callback URL'i otomatik backend uzerinden uretilir:

```txt
https://backend-domain.example.com/api/payments/iyzico/callback/
```

Sandbox test karti olarak iyzico'nun test panelinde verilen kartlari kullan. Yaygin basarili test karti:

```txt
Kart: 5528790000000008
SKT: gelecekteki herhangi bir ay/yil
CVC: 123
3D sifre gerekiyorsa: 123456
```

## Demo Users

Seed command sonrası demo hesapları:

- Admin: `yonetici / 123456`
- Customer: `musteri / 123456`

## Not

Yeni ürün fotoğrafı upload edilirse dosya backend instance diskinde kalır. Kalıcı demo için Cloudinary/S3 gibi external media storage eklemek gerekir. Sipariş, kayıt ve ürün verileri Postgres'te kalıcıdır.
