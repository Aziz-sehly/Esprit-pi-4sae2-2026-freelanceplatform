# Quick Setup Guide

## Installation & Running

1. **Install Dependencies**
   ```bash
   cd upwork-clone
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   # or
   ng serve
   ```

3. **Open in Browser**
   Navigate to `http://localhost:4200`

## First Steps

1. **Register an Account**
   - Click "Sign Up Free" or navigate to `/register`
   - Choose "Freelancer" or "Client"
   - Fill in your details (any email/password works)

2. **Browse Jobs**
   - Navigate to "Find Work" in the header
   - Use filters to refine search
   - Click on any job to view details

3. **Submit a Proposal**
   - Click on a job
   - Click "Submit a Proposal"
   - Fill in your rate, timeline, and cover letter
   - Submit!

## Default Login

You can use any email/password combination. The app uses mock authentication.

Example:
- Email: `test@example.com`
- Password: `password`

## Project Commands

```bash
# Development server
npm start                  # Start dev server on localhost:4200

# Build
npm run build             # Build for production
npm run watch             # Build and watch for changes

# Linting (if configured)
ng lint

# Testing (if configured)
ng test
```

## File Structure Overview

```
upwork-clone/
├── src/
│   ├── app/
│   │   ├── components/       # All page components
│   │   ├── services/         # Business logic & API
│   │   ├── models/           # TypeScript interfaces
│   │   ├── app.component.*   # Root component
│   │   └── app.routes.ts     # Routing config
│   ├── styles.scss           # Global styles
│   └── index.html            # Main HTML
├── angular.json              # Angular CLI config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

## Key Features to Explore

✅ **Landing Page** - Modern hero section with animations
✅ **Job Listings** - Advanced filtering and search
✅ **Job Details** - Comprehensive job information
✅ **Proposal System** - Submit proposals with rates
✅ **Authentication** - Login/Register flows
✅ **Responsive Design** - Works on all devices

## Customization

### Change Colors

Edit `src/app/app.component.scss`:
```scss
--primary: #0a0e27;        // Main dark color
--accent: #00d9ff;         // Accent color
--accent-secondary: #ff006e; // Secondary accent
```

### Add More Jobs

Edit `src/app/services/job.service.ts` and add to `mockJobs` array.

### Modify Branding

Change "Talently" to your brand name in:
- `src/app/app.component.html`
- `src/app/components/home/home.component.ts`
- `src/index.html`

## Troubleshooting

**Port already in use?**
```bash
ng serve --port 4201
```

**Dependencies not installing?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
Make sure you're using Node.js 18+ and Angular CLI 18+

## Next Steps

1. Replace mock services with real backend API
2. Add authentication guards for protected routes
3. Implement file upload for portfolios
4. Add real-time messaging with WebSocket
5. Integrate payment processing

Enjoy building your freelance platform! 🚀
