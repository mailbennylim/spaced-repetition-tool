# Running Reader on the Mac mini

Everything below is a one-time setup. Afterwards the app restarts itself after crashes and reboots.

## 1. Build and run
```bash
cd /Users/benny/Documents/Work__no-gdrive/spaced-repetition-tool
cp .env.example .env            # then fill in the values below
npm install
npx prisma db push
npm run build
```
`.env` values:
- `DATABASE_URL="file:./dev.db"`
- `APP_PASSWORD` — the password you'll type on your phone. Leave empty only while testing on the Mac itself.
- `READWISE_ACCESS_TOKEN` — from readwise.io/access_token, for the one-time import.
- `EMAIL_DOMAIN` — your domain (e.g. `example.com`); the app shows `…@library.example.com` and `…@feed.example.com`.
- `INBOUND_EMAIL_SECRET` — any long random string; the same value goes into the Cloudflare Email Worker.

Install the launchd job so it runs at boot and restarts on crash:
```bash
sed -i '' "s#/usr/local/bin/node#$(which node)#" deploy/com.benny.reader.plist
cp deploy/com.benny.reader.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.benny.reader.plist
```
Check: `curl -I http://localhost:3000` → 200 (or 307 to /login once `APP_PASSWORD` is set).

macOS settings to change yourself (System Settings → Energy): **Prevent automatic sleeping when the display is off** and **Start up automatically after a power failure**.

## 2. Reach it from the internet (Cloudflare Tunnel)
Needs a domain on Cloudflare (about $10/year).
```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create reader
```
Copy `deploy/cloudflared-config.yml` to `~/.cloudflared/config.yml`, fill in the tunnel id and hostname, then:
```bash
cloudflared tunnel route dns reader reader.YOURDOMAIN.com
sudo cloudflared service install
```
Open `https://reader.YOURDOMAIN.com` on the phone, sign in, then Chrome menu → **Add to Home screen** to install the app. Sharing from Chrome → **Reader** will then work.

## 3. Email newsletters
Cloudflare → your domain → **Email → Email Routing** → enable, then **Email Workers** → create a worker from `deploy/email-worker.js`
(add the `postal-mime` package in the worker's settings). Set its variables `APP_URL` and `INBOUND_EMAIL_SECRET`.
Add two routing rules: `*@library.YOURDOMAIN.com` → the worker, `*@feed.YOURDOMAIN.com` → the worker (catch-all is fine too).
Your two addresses appear in the app under Settings → Add to Library / Add to Feed.

## 4. Backups
```bash
crontab -e
# add:  15 3 * * * /Users/benny/Documents/Work__no-gdrive/spaced-repetition-tool/deploy/backup.sh
```
Backups land in `backups/` (30 days kept). Also include the folder in Time Machine.

## 5. Updating the app
```bash
git pull && npm install && npx prisma db push && npm run build
launchctl kickstart -k gui/$(id -u)/com.benny.reader
```
