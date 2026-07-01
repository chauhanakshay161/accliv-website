# Contact Form Setup — Accliv Group

This site uses Google Apps Script to process form submissions. It's completely free
and uses your own Google account to send emails. Every submission is also logged to
a Google Sheet so you have a simple lead record.

---

## What this gives you

- Contact form emails arrive at **info@acclivgroup.com** within seconds
- Auto-reply confirmation sent to the person who submitted
- Listing alert signups captured and emailed to you
- Resource download requests captured and emailed to you
- Every lead logged to a Google Sheet (your simple CRM)

---

## One-time setup (takes about 10 minutes)

### Step 1 — Create the Google Apps Script

1. Go to **https://script.google.com**
2. Sign in with the Google account connected to `info@acclivgroup.com`
   (or any Gmail account you want to receive the emails)
3. Click **"New project"**
4. Delete all the default code in the editor
5. Open the file `scripts/form-handler.gs` from this project folder
6. Copy everything in that file and paste it into the Apps Script editor
7. Press **Ctrl+S** to save
8. Name the project **"Accliv Group Form Handler"**

### Step 2 — Create a Google Sheet for leads

1. In the Apps Script editor, go to **File > New > Spreadsheet**
   (or go to Google Sheets and create a blank sheet)
2. Name it **"Accliv Group Leads"**
3. Back in the Apps Script editor, click **Resources > Advanced Google Services**
   and make sure **Sheets API** is enabled
4. At the top of the form-handler.gs code, the `logToSheet` function will
   automatically create a "Leads" tab when the first submission arrives

### Step 3 — Deploy as a Web App

1. In the Apps Script editor, click **"Deploy"** (top right)
2. Click **"New deployment"**
3. Click the gear icon next to "Type" and select **"Web app"**
4. Set **"Execute as"**: **Me** (your Google account)
5. Set **"Who has access"**: **Anyone**
6. Click **"Deploy"**
7. Google will ask you to authorise the app — click through the permissions
   (it needs permission to send email and write to sheets)
8. **Copy the Web App URL** that appears — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

### Step 4 — Add the URL to the website

Open these three files and find the line:

```javascript
var FORM_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with the URL you just copied.
The line appears in:

- `contact.html` (main contact form)
- `listings.html` (listing notification signup)
- `resources.html` (resource download forms)

Save the files and push to GitHub:

```bash
git add contact.html listings.html resources.html
git commit -m "connect forms to Google Apps Script"
git push origin main
```

### Step 5 — Test it

1. Go to your live site and submit the contact form with a test message
2. Check `info@acclivgroup.com` — you should receive the notification email
3. Check the email address you submitted with — you should receive the auto-reply
4. Open your Google Sheet "Accliv Group Leads" — the submission should appear

---

## Updating the script

If you need to change anything (like the recipient email or auto-reply wording):

1. Go to **https://script.google.com** and open "Accliv Group Form Handler"
2. Make your changes to `form-handler.gs`
3. Click **Deploy > Manage deployments**
4. Click the pencil icon next to your deployment
5. Change version to **"New version"**
6. Click **Deploy**

The URL stays the same — no changes needed in the HTML files.

---

## If something isn't working

- Make sure the script is deployed as "Anyone" can access (not "Anyone with Google account")
- Make sure you authorised all permissions when prompted
- Check the Apps Script execution log: **View > Executions** in the script editor
- The form still shows success in-browser even if the script fails, because we
  use `no-cors` mode. Check the Executions log to see if emails are actually being sent.
