#!/bin/bash
# Script to set up HTTPS for Node.js application using Let's Encrypt

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up HTTPS for your Node.js application${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run this script as root or with sudo${NC}"
  exit 1
fi

# Get the domain name
echo -e "${YELLOW}Enter your domain name (e.g., example.com):${NC}"
read domain_name

if [ -z "$domain_name" ]; then
  echo -e "${RED}Domain name cannot be empty${NC}"
  exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}Certbot not found. Installing...${NC}"
  
  # Check the OS
  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y certbot
  elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    yum install -y certbot
  else
    echo -e "${RED}Unsupported OS. Please install certbot manually.${NC}"
    exit 1
  fi
fi

# Stop the Node.js server to free up port 80
echo -e "${YELLOW}Stopping your Node.js server...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 stop all
else
  echo -e "${YELLOW}PM2 not found. Make sure your Node.js server is not running on port 80.${NC}"
fi

# Get SSL certificate using standalone mode
echo -e "${GREEN}Obtaining SSL certificate from Let's Encrypt...${NC}"
certbot certonly --standalone --preferred-challenges http -d $domain_name

# Create ssl directory in the backend folder
ssl_dir="$(pwd)/ssl"
mkdir -p $ssl_dir

# Copy certificates to the ssl directory
echo -e "${GREEN}Copying certificates to $ssl_dir...${NC}"
cp /etc/letsencrypt/live/$domain_name/privkey.pem $ssl_dir/
cp /etc/letsencrypt/live/$domain_name/fullchain.pem $ssl_dir/

# Set proper permissions
chmod 644 $ssl_dir/privkey.pem
chmod 644 $ssl_dir/fullchain.pem

# Restart the Node.js server
echo -e "${YELLOW}Restarting your Node.js server...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 restart all
else
  echo -e "${YELLOW}PM2 not found. Please start your Node.js server manually.${NC}"
fi

echo -e "${GREEN}HTTPS setup complete!${NC}"
echo -e "${GREEN}Your SSL certificates are in $ssl_dir${NC}"
echo -e "${GREEN}Your HTTPS server should now be running on https://$domain_name:5001${NC}"
echo -e "${YELLOW}Note: You may need to open port 5001 in your firewall/security group${NC}"
echo -e "${YELLOW}To automatically renew your certificates, add a cron job:${NC}"
echo -e "${YELLOW}0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$domain_name/privkey.pem $ssl_dir/ && cp /etc/letsencrypt/live/$domain_name/fullchain.pem $ssl_dir/${NC}"
