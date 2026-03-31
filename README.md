# Student Hub (Django + Neon + Vercel)

## First deployment (Vercel + GitHub)

1. Push code to GitHub (already done).
2. In Vercel, import this repository.
3. Set framework preset to `Other`.
4. Add these Environment Variables in Vercel Project Settings:
   - `SECRET_KEY` = strong random string
   - `DEBUG` = `False`
   - `DATABASE_URL` = Neon connection string
   - `ALLOWED_HOSTS` = `.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` = `https://*.vercel.app`
   - `SECURE_SSL_REDIRECT` = `True`
   - `SESSION_COOKIE_SECURE` = `True`
   - `CSRF_COOKIE_SECURE` = `True`
   - `CLOUDINARY_URL` = `cloudinary://<api_key>:<api_secret>@<cloud_name>`
5. Deploy.

## Migrations on Neon

Run migrations from your local machine against Neon:

```bash
py manage.py migrate
```

This is required before using the app on Vercel.

## Create admin account

```bash
py manage.py createsuperuser
```

Then login at:

- `/admin/`

## Notes

- Media uploads are production-ready when `CLOUDINARY_URL` is set. Without it, local media storage is used (not suitable for Vercel production).
- Static files are served using WhiteNoise configuration.
