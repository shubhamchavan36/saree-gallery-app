This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Environment & Database

This app stores saree data in MongoDB and images in Vercel Blob. Set these variables before running or deploying:

```env
# MongoDB connection
MONGODB_URI="mongodb+srv://shubham36chavan_db_user:KPjyLqhoGOKoOznI@sareesgallery.h6l2ezp.mongodb.net/saree_gallery?appName=sareesgallery"

# Vercel Blob for image storage (get from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_VALUE=saree-gallery-admin-auth
```

For Vercel deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the above variables (BLOB_READ_WRITE_TOKEN is auto-generated when you enable Blob)

Replace `<cluster>` with your Atlas cluster address. The defaults above match the project’s built-in credentials.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
