# Deployment Guide

## Backend Configuration

Your backend is hosted at: **https://api-mashan-naturalbasket.onrender.com**

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the `masan-organic` directory:

```env
VITE_API_URL=https://api-mashan-naturalbasket.onrender.com
```

### 2. Local Development

For local development, use:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

### 4. Deploy to Hosting Platform

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variable `VITE_API_URL` in Vercel dashboard

#### Netlify
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set environment variable `VITE_API_URL` in Netlify dashboard

#### Render
1. Build command: `npm run build`
2. Start command: `npm run preview` (or use a static site server)
3. Set environment variable `VITE_API_URL` in Render dashboard

## Important Notes

- All API calls now use the `VITE_API_URL` environment variable
- The frontend will automatically use the hosted backend URL when `VITE_API_URL` is set
- Make sure to set the environment variable in your hosting platform's settings
- The backend CORS is configured to accept requests from any origin (`*`)

## API Endpoints

All endpoints are prefixed with the `VITE_API_URL`:
- Products: `/api/products`
- Orders: `/api/orders`
- Messages: `/api/messages`
- Banners: `/api/banners`
- Coupons: `/api/coupons`
- Admin routes: `/api/admin/*`
