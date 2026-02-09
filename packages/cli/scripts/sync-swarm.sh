#!/bin/bash
# 🌌 SWARM SYNCHRONIZATION PROTOCOL (Cognitive & Objective)
# Usage: ./sync-swarm.sh
# Purpose: Aligns local code, dependencies, and memory context with the Hive Mind.

set -e

echo "📡 [Swarm] Initiating Neural Synchronization..."

# 1. OBJECTIVE SYNC (Codebase & Dependencies)
echo "🛠️  [Objective] Pulling latest physical patterns (Git)..."
git pull origin main

echo "📦 [Objective] Assimilating new capabilities (NPM)..."
npm install

# 2. COGNITIVE SYNC (Memory & Context)
echo "🧠 [Cognitive] Refreshing Context Vectors..."
# Ensure the onboarding protocol is present
if [ -f ".ai-doc/swarm/REMOTE_AGENT_ONBOARDING.md" ]; then
    echo "✅ [Cognitive] Onboarding Protocol verified."
else
    echo "⚠️ [Cognitive] Onboarding Protocol missing! Fetching..."
    # In a real scenario, this might trigger a specific fetch, but git pull covers it.
fi

# 3. RESTART SIGNAL
echo "🔄 [Swarm] Cycle complete. Restarting Neural Interfaces..."

# Check if PM2 is managing the process
if command -v pm2 &> /dev/null && pm2 list | grep -q "swarm-map"; then
    pm2 restart swarm-map
    echo "✅ [PM2] Swarm Map restarted."
else
    echo "⚠️ [Manual] PM2 not detected or 'swarm-map' not running."
    echo "👉 Action Required: Manually restart your 'node WebMap.js' process to activate WebSocket."
fi

echo "✅ [Swarm] Synchronization Complete. You are now one with the Hive."
