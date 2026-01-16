# Quick Start: axios-ai-mail Web UI

## Fastest Way to Test (Development Mode)

Since the package hasn't been rebuilt yet, here's the quickest way to test the web UI:

### 1. Install API Dependencies

```bash
cd ~/Projects/axios-ai-mail
pip install 'fastapi>=0.104' 'uvicorn[standard]>=0.24' 'websockets>=12.0'
```

Or if using the development environment:
```bash
nix develop
pip install -e '.[api]'
```

### 2. Start the Backend API

```bash
# From the project root
cd ~/Projects/axios-ai-mail
uvicorn axios_ai_mail.api.main:app --reload --port 8080
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 3. Start the Frontend Dev Server

**Open a new terminal:**
```bash
cd ~/Projects/axios-ai-mail/web
npm install  # Only needed once
npm run dev
```

You should see:
```
  VITE v5.1.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 4. Open Your Browser

Navigate to: **http://localhost:5173**

You should see the axios-ai-mail web interface!

## What to Test

### First Time Setup
1. **Check the message list** - You should see your synced emails
2. **Click on a message** - View full details
3. **Click on a tag** - Filter messages by that tag
4. **Try the search** - Search for emails by subject or sender
5. **Toggle "Unread only"** - Filter to show only unread messages
6. **Open the sidebar** - Click the menu icon (☰) in the top left

### Tag Management
1. **Click on a message** to open detail view
2. **Click "+ Edit"** next to tags
3. **Add or remove tags** using the autocomplete
4. **Click "Save"** - Changes persist to database
5. **Go back to inbox** - See updated tags

### Sync Testing
1. **Click the sync button** (🔄) in the top right
2. Watch the spinner appear
3. See real-time updates as messages are classified
4. New messages appear automatically (via WebSocket)

### Navigation
- **Inbox** - Message list
- **Accounts** - See statistics per account
- **Statistics** - View analytics and tag distribution
- **Settings** - See current configuration (read-only)

## Troubleshooting

### "Failed to load messages"
- Check that the backend is running (`http://localhost:8080/api/health`)
- Check that you've run at least one sync: `axios-ai-mail sync run`
- Check browser console for errors (F12)

### "Connection refused" or CORS errors
- Make sure backend is running on port 8080
- Make sure frontend dev server is running on port 5173
- Check that both servers started without errors

### No messages showing
- Run a sync first: `axios-ai-mail sync run`
- Check database exists: `ls ~/.local/share/axios-ai-mail/mail.db`
- Check API endpoint: `curl http://localhost:8080/api/messages`

### WebSocket not connecting
- Check browser console for WebSocket errors
- Make sure backend is running
- Try refreshing the page

### Frontend not building
```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Production Deployment (After Testing)

Once you've tested and everything works, rebuild the package:

```bash
cd ~/Projects/axios-ai-mail
nix build
```

This will:
1. Build the frontend (`npm ci && npm run build`)
2. Bundle it with the Python package
3. Create `./result/bin/axios-ai-mail` with the `web` command

Then test the production build:
```bash
./result/bin/axios-ai-mail web
# Opens at http://localhost:8080 (serves both API and frontend)
```

Finally, enable in your NixOS config:
```nix
programs.axios-ai-mail = {
  enable = true;
  ui.enable = true;  # Enable web UI
  ui.port = 8080;
  # ... rest of config
};
```

```bash
home-manager switch
systemctl --user status axios-ai-mail-web
```

Access at: **http://localhost:8080**

## API Documentation

While the backend is running, visit:
- **Swagger UI:** http://localhost:8080/docs
- **ReDoc:** http://localhost:8080/redoc
- **Health Check:** http://localhost:8080/api/health

## Development Tips

### Auto-reload
- Backend: Uses `--reload` flag (watches Python files)
- Frontend: Vite dev server has HMR (Hot Module Replacement)
- Edit files and see changes instantly!

### Browser DevTools
- Press **F12** to open DevTools
- **Console tab** - See WebSocket events and any errors
- **Network tab** - Inspect API requests/responses
- **React DevTools** - Install extension to inspect React components

### Common Development Tasks

**Clear React Query cache:**
```javascript
// In browser console
queryClient.clear()
```

**Manually invalidate messages:**
```javascript
// In browser console
queryClient.invalidateQueries({ queryKey: ['messages'] })
```

**Test WebSocket events:**
```javascript
// Backend will broadcast sync events
// Watch in browser console for real-time updates
```

## Next Steps

After testing the web UI:
1. Report any bugs or issues
2. Suggest UI/UX improvements
3. Test with larger datasets (1000+ messages)
4. Try on mobile devices (responsive design)

Enjoy your new AI-powered email workflow with a beautiful Material Design interface! 🎉
