# Deploying NoteNest Backend to PythonAnywhere

This guide provides step-by-step instructions for deploying the NoteNest backend to PythonAnywhere's free tier.

## Step 1: Create a PythonAnywhere Account

1. Go to [PythonAnywhere](https://www.pythonanywhere.com/) and sign up for a free account
2. Confirm your email and log in to your dashboard

## Step 2: Upload Your Code

You can either upload a ZIP file or use Git:

### Option A: Upload a ZIP file
1. Create a ZIP archive of your backend directory
2. In PythonAnywhere dashboard, go to "Files" tab
3. Click "Upload a file" and select your ZIP
4. Once uploaded, click on the ZIP file and select "Extract"

### Option B: Use Git (recommended)
1. In PythonAnywhere dashboard, go to "Consoles" tab
2. Start a new Bash console
3. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/Smart-Note-Organizer.git
   ```
4. Navigate to the backend directory:
   ```bash
   cd Smart-Note-Organizer/backend
   ```

## Step 3: Create a Virtual Environment

In the Bash console:

1. Create a virtual environment (Python 3.9 recommended):
   ```bash
   mkvirtualenv --python=python3.9 notenest-venv
   ```

2. Activate the virtual environment:
   ```bash
   workon notenest-venv
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

## Step 4: Configure Web App

1. Go to the "Web" tab in your PythonAnywhere dashboard
2. Click "Add a new web app"
3. Choose your domain name (it will be yourusername.pythonanywhere.com)
4. Select "Manual configuration"
5. Choose Python 3.9
6. Complete the wizard

## Step 5: Configure WSGI File

1. In the Web tab, scroll down to the "Code" section
2. Click on the WSGI configuration file link
3. Replace the content with:

```python
import os
import sys

# Add your project directory to the sys.path
path = '/home/yourusername/Smart-Note-Organizer/backend'
if path not in sys.path:
    sys.path.append(path)

# Set environment variable to use the right settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'smart_note_organizer.settings'

# Set up environment variables (replace with your actual values)
os.environ['OPENROUTER_API_KEY'] = 'your-api-key-here'
os.environ['AI_MODEL'] = 'meta-llama/llama-3.3-70b-instruct:free'
os.environ['API_REFERER'] = 'https://yourdomain.netlify.app'

# Set up the WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

4. Save the file

## Step 6: Configure Virtual Environment Path

1. In the Web tab, scroll down to the "Virtualenv" section
2. Enter the path to your virtual environment:
   ```
   /home/yourusername/.virtualenvs/notenest-venv
   ```

## Step 7: Configure Static Files (Optional)

1. In the Web tab, scroll down to "Static files"
2. Add a static files mapping:
   - URL: /static/
   - Directory: /home/yourusername/Smart-Note-Organizer/backend/static

## Step 8: Update Django Settings

1. Open your settings.py file from the Files tab
2. Update the ALLOWED_HOSTS setting to include your PythonAnywhere domain:
   ```python
   ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'yourusername.pythonanywhere.com']
   ```
3. Update the CORS_ALLOWED_ORIGINS to include your Netlify frontend:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://your-app-name.netlify.app",
       "http://localhost:5173",
       "http://localhost:5174",
   ]
   ```
4. Set DEBUG to False for production:
   ```python
   DEBUG = False
   ```
5. Save the file

## Step 9: Update Netlify Configuration

1. In your Netlify deployment settings, update the environment variable:
   ```
   VITE_API_BASE_URL=https://yourusername.pythonanywhere.com/api
   ```

## Step 10: Reload Web App

1. Go back to the Web tab in PythonAnywhere
2. Click the "Reload" button for your web app

## Step 11: Test Your Deployment

Visit `https://yourusername.pythonanywhere.com/api/ping` to verify your API is working correctly.

## Free Tier Limitations

- 512MB storage
- CPU quotas (may slow down with heavy AI processing)
- Web app goes to sleep if inactive (slow initial response)
- Cannot use custom domains on free tier
- Limited database size

## Troubleshooting

1. Check the error logs in the Web tab
2. Make sure all dependencies are installed
3. Verify the paths in the WSGI file are correct
4. Ensure database migrations are applied:
   ```bash
   python manage.py migrate
   ```

## Setting up Scheduled Tasks (Optional)

If you need to keep your app from going to sleep on the free tier:
1. Go to the "Tasks" tab
2. Add a scheduled task that makes a request to your site every 2 hours
3. Use a command like `curl -s https://yourusername.pythonanywhere.com/api/ping > /dev/null` 