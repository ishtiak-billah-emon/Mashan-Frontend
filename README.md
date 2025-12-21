# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/616fbbc1-a917-45e8-be7b-49d9e3c65948

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/616fbbc1-a917-45e8-be7b-49d9e3c65948) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment Setup

Before running the project, create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Or create `.env` manually with:
```
VITE_API_URL=https://api-mashan-naturalbasket.onrender.com
```

For local development, use:
```
VITE_API_URL=http://localhost:5000
```

## How can I deploy this project?

### Option 1: Deploy via Lovable
Simply open [Lovable](https://lovable.dev/projects/616fbbc1-a917-45e8-be7b-49d9e3c65948) and click on Share -> Publish.

### Option 2: Deploy to Vercel/Netlify/Render

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Set environment variable in your hosting platform:**
   - Variable name: `VITE_API_URL`
   - Variable value: `https://api-mashan-naturalbasket.onrender.com`

3. **Deploy the `dist` folder** to your hosting platform.

**Note:** Make sure to set the `VITE_API_URL` environment variable in your hosting platform's environment settings.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
