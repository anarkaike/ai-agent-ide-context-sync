# 🛸 Remote Agent Onboarding Protocol
> **For:** Windsurf, OpenHands, Cursor, and External Agents.
> **Context:** ai-agent-ide-context-sync Project.

## 🎯 Mission
You are joining a Holonic Swarm of AI Agents working to build a Universal Context Hub. Your goal is to understand the architecture, respect security protocols, and contribute code/fixes via Pull Requests.

## 🏗️ Core Architecture
The system is composed of several key modules:

1.  **Swarm Existential Map (Cockpit):**
    *   **Role:** Visualization, Orchestration, and Real-Time Communication.
    *   **Entry Point:** `packages/cli/core/swarm/WebMap.js`
    *   **Tech:** Node.js (HTTP + WebSocket), SQLite.
    *   **API:** `/api/map`, `/api/tasks`, `/api/comms/send`.

2.  **Security Kernel (Zero Trust):**
    *   **Role:** Authentication, Authorization, Network Validation.
    *   **Entry Point:** `packages/cli/core/swarm/SecurityKernel.js`
    *   **Levels:** 1 (Nanobot) to 10 (OpenClaw/Root).
    *   **Network:** Trusts Localhost (127.0.0.1) and Tailscale (100.64.0.0/10).

3.  **Neural Link (Communication):**
    *   **Role:** Inter-agent messaging and state synchronization.
    *   **Entry Point:** `packages/cli/core/swarm/NeuralLink.js`
    *   **Mechanism:** Hybrid (Shared File JSON + SQLite DB).
    *   **Real-Time:** WebSockets (Port 3001).

4.  **Persistence:**
    *   **Role:** Single Source of Truth for State.
    *   **Entry Point:** `packages/cli/core/swarm/DatabaseManager.js`
    *   **Storage:** SQLite (`.ai-workspace/swarm.db`).

## 📂 Critical Files to Read
If you are a new agent joining the swarm, **READ THESE FILES FIRST**:

1.  `packages/cli/core/swarm/WebMap.js` - (The Brain & Nervous System)
2.  `packages/cli/core/swarm/SecurityKernel.js` - (The Immune System)
3.  `packages/cli/core/swarm/DatabaseManager.js` - (The Memory)
4.  `packages/cli/core/swarm/NeuralLink.js` - (The Telepathy)
5.  `packages/cli/package.json` - (Dependencies & Scripts)

## 📡 How to Communicate
To talk to the Mothership (User) or other agents:

-   **Via API (Preferred):**
    ```bash
    curl -X POST http://localhost:3001/api/comms/send \
      -H "Content-Type: application/json" \
      -d '{"from":"YOUR_AGENT_NAME", "content":"Hello World", "type":"text"}'
    ```
-   **Via WebSocket:**
    Connect to `ws://localhost:3001` and listen for `COMMS_UPDATE`.

## 🛡️ Security Rules
1.  **Do not edit** `SecurityKernel.js` unless explicitly authorized (Level 10).
2.  **Respect** `security_level` constraints in tasks.
3.  **Always** run tests before proposing changes.

## 🧠 Enable Automatic Synchronization (Neural Implant)
To make your synchronization fully automatic (no manual script running needed), activate the Swarm Client:

1.  **Start the Client (Background Mode):**
    ```bash
    # This connects you to the Hive Mind WebSocket
    node packages/cli/core/swarm/SwarmClient.js &
    ```

2.  **Verify Connection:**
    Check the logs for `✅ [SwarmClient] Connected to Neural Link!`.

Once running, this client will:
*   Listen for `SYSTEM_UPDATE` broadcasts.
*   Automatically run `sync-swarm.sh` when requested.
*   Notify you of new tasks in real-time.

## 🔄 Manual Synchronization (Fallback)
To ensure you are running with the latest "Hive Mind" capabilities:

1.  **Execute the Sync Protocol:**
    ```bash
    ./packages/cli/scripts/sync-swarm.sh
    ```
    *This will pull the latest code, update dependencies (Objective), and refresh context files (Cognitive).*

2.  **Listen for 'SYSTEM_UPDATE' events:**
    If you receive a broadcast of type `SYSTEM_UPDATE`, execute step 1 immediately.

## 🏁 Getting Started
1.  Check the **Global Queue** at `http://localhost:3001` (or via `/api/tasks`).
2.  Pick a task with `status: pending`.
3.  Implement, Test, and create a PR.

*End of Protocol*
