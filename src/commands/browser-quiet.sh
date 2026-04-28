#!/bin/bash
# Quiet wrapper for browser-pilot - filters out INFO logs

# Run browser-pilot and filter output
node .browser-pilot/bp.js "$@" 2>&1 | grep -v '^\[browser-pilot\]' | grep -v '^✓ Daemon started' | grep -v '^🚀 Starting' | grep -v '^Browser will stay open' | grep -v '^Use "daemon-stop"' | grep -v '^📊 Daemon Status:' | grep -v '^Connected:' | grep -v '^Debug Port:' | grep -v '^Console Messages:' | grep -v '^Network Errors:' | grep -v '^Uptime:' | grep -v '^Last Activity:' | grep -v '^✓ Found element' | grep -v '^✓ Clicked:' | grep -v '^🔍 Searching for:' | grep -v '^📁 Map path:' | grep -v '^Navigated to:' | grep -v '^Extracted text:' | grep -v '^Browser remains open.'
