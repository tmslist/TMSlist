#!/bin/bash
set -e

# ============================================================
# TMSlist Deployment Script for Hostinger VPS (USA)
# Run: ssh root@2.24.194.230 "bash -s" < scripts/deploy-hostinger.sh
# Or copy the script to the server and run it there.
# ============================================================

APP_DIR="/var/www/tmslist"
DOMAIN="tmslist.com"
PORT=4321
REPO_URL="https://github.com/tmslist/TMSlist.git"
ENTRY_FILE=""

echo "=== TMSlist Deployment Script ==="
echo "Node version: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "npm version:  $(npm --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "PM2 version: $(pm2 --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "nginx version: $(nginx -v 2>&1)"
echo ""

# 1. Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "[1/8] Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "[1/8] Node.js already installed: $(node --version)"
fi

# 2. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "[2/8] Installing PM2..."
    npm install -g pm2
else
    echo "[2/8] PM2 already installed"
fi

# 3. Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "[3/8] Installing nginx..."
    apt-get install -y nginx
else
    echo "[3/8] nginx already installed"
fi

# 4. Create app directory and clone/pull repo
echo "[4/8] Setting up app directory..."
mkdir -p $APP_DIR
cd $APP_DIR

if [ -d ".git" ]; then
    echo "  Pulling latest from GitHub..."
    git pull origin main
else
    echo "  Cloning repository..."
    git clone $REPO_URL $APP_DIR
fi

# 5. Create .env file from template if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo "[5/8] Creating .env file from template..."
    cp $APP_DIR/.env.example $APP_DIR/.env
    echo "  ⚠️  PLEASE EDIT $APP_DIR/.env AND FILL IN YOUR SECRETS!"
else
    echo "[5/8] .env file already exists"
fi

# 6. Install dependencies and build
echo "[6/8] Installing dependencies..."
npm install

echo "[7/8] Building project..."
npm run build

# 8. Find entry file and start PM2
echo "[8/8] Starting app with PM2..."
cd $APP_DIR

# Astro @astrojs/node standalone mode outputs to dist/server/
for f in dist/server/entry.mjs dist/server/standalone.mjs .output/server/entry.mjs; do
    if [ -f "$APP_DIR/$f" ]; then
        ENTRY_FILE="$APP_DIR/$f"
        break
    fi
done

if [ -z "$ENTRY_FILE" ]; then
    echo "ERROR: Could not find entry file. Check build output."
    ls $APP_DIR/dist/ 2>/dev/null || echo "No dist/ directory"
    ls $APP_DIR/.output/ 2>/dev/null || echo "No .output/ directory"
    exit 1
fi

echo "  Found entry file: $ENTRY_FILE"

pm2 stop tmslist 2>/dev/null || true
pm2 delete tmslist 2>/dev/null || true

pm2 start "$ENTRY_FILE" --name tmslist
pm2 save

# Configure nginx
echo ""
echo "=== Configuring nginx ==="
cat > /etc/nginx/sites-available/tmslist <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN 2.24.194.230;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/tmslist /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

echo ""
echo "=== Deployment complete! ==="
echo "App running on: http://127.0.0.1:$PORT"
echo "Domain:         https://$DOMAIN (after SSL cert)"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env with your real API keys"
echo "  2. Set up SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "  3. Point DNS A record for $DOMAIN to 2.24.194.230"
echo ""
echo "Useful commands:"
echo "  pm2 logs tmslist        - view logs"
echo "  pm2 restart tmslist     - restart app"
echo "  pm2 monit               - monitor"
echo "  pm2 env set KEY=VALUE   - set env vars"
