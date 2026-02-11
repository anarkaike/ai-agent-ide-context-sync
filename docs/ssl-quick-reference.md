# 📋 SSL & HTTPS Knowledge Base - Quick Reference

## 🎯 Essential Commands

### SSL Certificate Management
```bash
# Check certificate status
openssl s_client -connect domain.com:443 -servername domain.com

# Renew Let's Encrypt
certbot renew --quiet

# Emergency certificate issue
certbot certonly --standalone -d domain.com

# Test auto-renewal
certbot renew --dry-run
```

### Nginx Configuration
```bash
# Test configuration
nginx -t

# Reload gracefully
nginx -s reload

# Check syntax
nginx -T

# View active config
docker exec nginx-container nginx -T
```

### Health Monitoring
```bash
# Check HTTPS status
curl -I https://domain.com

# Test all endpoints
curl -I https://domain.com/{path1,path2,path3}

# Monitor response time
curl -w "@curl-format.txt" -o /dev/null -s https://domain.com
```

## 🔧 Configuration Templates

### SSL Nginx Template
```nginx
server {
    listen 443 ssl http2;
    server_name DOMAIN.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/DOMAIN.crt;
    ssl_certificate_key /etc/ssl/certs/DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Your application proxy
    location / {
        proxy_pass http://upstream-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name DOMAIN.com;
    return 301 https://$server_name$request_uri;
}
```

### Auto-Renewal Cron
```bash
# Daily certificate check
0 12 * * * /usr/bin/certbot renew --quiet

# Weekly health check
0 9 * * 1 /path/to/health-monitor.sh

# Monthly knowledge sync
0 3 1 * * /path/to/nanobot-sync.sh
```

## 🚨 Troubleshooting Quick Guide

### Common Issues & Solutions

#### Certificate Errors
```bash
# Problem: Certificate expired
# Solution: Renew certificate
certbot renew --force-renewal -d domain.com

# Problem: Domain not resolving
# Solution: Check DNS
dig +short domain.com
nslookup domain.com

# Problem: Port 443 blocked
# Solution: Check and free port
ss -tlnp | grep 443
systemctl stop conflicting-service
```

#### Nginx Issues
```bash
# Problem: 502 Bad Gateway
# Solution: Check upstream
docker logs nginx-container
curl http://upstream-service:port

# Problem: Configuration error
# Solution: Test and fix
nginx -t
# Fix syntax errors, then reload
nginx -s reload

# Problem: Mixed content
# Solution: Update HTTP references
grep -r "http://" /var/www/html/
```

#### Performance Issues
```bash
# Problem: Slow SSL handshake
# Solution: Optimize SSL settings
# Use stronger ciphers, enable session cache

# Problem: High memory usage
# Solution: Tune worker processes
# Adjust worker_connections in nginx.conf
```

## 📊 Monitoring Commands

### Certificate Monitoring
```bash
# Check expiry dates
for domain in domain1.com domain2.com; do
    echo "=== $domain ==="
    openssl s_client -connect $domain:443 -servername $domain 2>/dev/null |
    openssl x509 -noout -dates
done

# Automated monitoring script
#!/bin/bash
EXPIRY_THRESHOLD=30
for domain in $(cat domains.txt); do
    expiry=$(openssl s_client -connect $domain:443 -servername $domain 2>/dev/null |
             openssl x509 -noout -enddate | cut -d= -f2)
    days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
    if [ $days_left -lt $EXPIRY_THRESHOLD ]; then
        echo "WARNING: $domain expires in $days_left days"
    fi
done
```

### Performance Monitoring
```bash
# Response time monitoring
curl -w "%{time_total}\n" -o /dev/null -s https://domain.com

# SSL handshake time
curl -w "%{time_appconnect}\n" -o /dev/null -s https://domain.com

# Full performance report
curl -w "@curl-format.txt" -o /dev/null -s https://domain.com
```

## 🤖 Nanobot Network Integration

### Agent Communication
```javascript
// Request SSL help
const sslHelp = await nanobot.request({
  agent: 'ssl-certificate-manager',
  action: 'diagnose',
  domain: 'example.com',
  issue: 'certificate_error'
});

// Get health status
const health = await nanobot.request({
  agent: 'deploy-health-monitor',
  action: 'check',
  environments: ['https://domain1.com', 'https://domain2.com']
});
```

### Knowledge Sharing
```bash
# Share successful pattern
nanobot knowledge share \
  --topic=ssl-renewal-pattern \
  --content="renew-30-days-before-expiry" \
  --success-rate=0.98

# Request help from network
nanobot help \
  --topic=nginx-configuration \
  --issue="upstream-timeout" \
  --urgency=high
```

## 📚 Essential Files Locations

### SSL Certificates
```bash
# Let's Encrypt certificates
/etc/letsencrypt/live/DOMAIN/
├── fullchain.pem
├── privkey.pem
└── README

# Self-signed certificates
/etc/ssl/certs/
├── DOMAIN.crt
├── DOMAIN.key
└── ca-bundle.crt
```

### Nginx Configuration
```bash
# Main configuration
/etc/nginx/nginx.conf
/etc/nginx/sites-enabled/DOMAIN

# Docker-based configuration
/root/projects/conf/
├── kanban-paths.conf
├── nginx-wildcard.conf
└── ssl-configs/
```

### Skills and Documentation
```bash
# SSL Certificate Manager skill
/root/projects/dev/ai-agent-ide-context-sync/skills/ssl-certificate-manager/
├── index.js
├── README.md
├── install.sh
└── examples/

# Health Monitor skill
/root/projects/dev/ai-agent-ide-context-sync/skills/deploy-health-monitor/
├── index.js
├── README.md
└── troubleshooting-guide.md

# Documentation
/root/projects/dev/ai-agent-ide-context-sync/docs/
├── ssl-implementation-guide.md
├── nanobot-distribution.md
└── ssl-quick-reference.md
```

## 🎯 Best Practices Checklist

### SSL Management
- [ ] Use Let's Encrypt for production
- [ ] Configure auto-renewal 30 days before expiry
- [ ] Use strong ciphers (TLS 1.2+)
- [ ] Implement HSTS with includeSubDomains
- [ ] Monitor certificate expiry weekly
- [ ] Test renewal process monthly

### Nginx Configuration
- [ ] Separate configs for each service
- [ ] Use upstream blocks for load balancing
- [ ] Implement rate limiting
- [ ] Configure proper logging
- [ ] Test configs before reload
- [ ] Backup configurations before changes

### Security Headers
- [ ] HSTS with max-age=31536000
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options nosniff
- [ ] X-XSS-Protection mode=block
- [ ] Referrer-Policy strict-origin-when-cross-origin
- [ ] Content-Security-Policy configured

### Monitoring
- [ ] HTTPS endpoint monitoring
- [ ] Certificate expiry monitoring
- [ ] Performance metrics collection
- [ ] Error alerting setup
- [ ] Automated health checks
- [ ] Knowledge base updates

## 🚀 Emergency Procedures

### Certificate Emergency
```bash
# 1. Check certificate status
openssl s_client -connect domain.com:443 -servername domain.com

# 2. Emergency renewal
certbot certonly --standalone -d domain.com --force-renewal

# 3. Update services
docker restart nginx-container

# 4. Verify fix
curl -I https://domain.com
```

### Service Emergency
```bash
# 1. Check service status
docker ps | grep nginx
systemctl status nginx

# 2. Restart services
docker restart nginx-container
systemctl restart nginx

# 3. Check logs
docker logs nginx-container | tail -50
journalctl -u nginx | tail -50

# 4. Validate configuration
nginx -t
curl -I https://domain.com
```

---

## 📞 Support Resources

### Nanobot Network
- **SSL Certificate Manager Agent:** ssl-certificate-manager
- **Health Monitor Agent:** deploy-health-monitor
- **Trust Network:** trust-network-ai-agent

### Documentation
- **Complete Guide:** ssl-implementation-guide.md
- **Distribution Guide:** nanobot-distribution.md
- **Skill Documentation:** /skills/*/README.md

### Community
- **Troubleshooting:** /skills/deploy-health-monitor/troubleshooting-guide.md
- **Best Practices:** Nanobot Network knowledge base
- **Patterns:** Collective agent experiences

---

*Generated by AI Agent - 10 de Fevereiro de 2026*  
*SSL & HTTPS Knowledge Base - Quick Reference*
