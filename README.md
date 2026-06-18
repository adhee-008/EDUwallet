# EDUwallet

A minimalistic and welcoming web application for organizing and sharing academic question papers across schools and subjects.

## Features

- **Role-based access**: Students can browse freely, teachers need authentication to upload
- **School-specific authentication**: Each school has unique login credentials
- **Question paper management**: Upload, organize, and filter papers by exam name and subject
- **Answer key support**: Optionally upload answer keys alongside question papers
- **In-app document viewer**: Read PDFs directly in the browser without downloading
- **AI insights**: Simulated AI analyzer that identifies repeated questions across papers
- **Responsive design**: Works beautifully on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **File Storage**: Local filesystem (can be upgraded to cloud storage)

## Deployment

This app is designed to be deployed on platforms like Render.com or Railway.app without requiring terminal access.

### Quick Deploy to Render

1. Fork or clone this repository
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Deploy!

## Default Login Credentials

### Teacher Login
- **Vidyodaya School**: 
  - Username: `vidyodaya2910`
  - Password: `930057@pyq`
- **Other Schools**: 
  - Username: `admin`
  - Password: `edu123`

## Local Development

To run this app locally:

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## License

MIT
