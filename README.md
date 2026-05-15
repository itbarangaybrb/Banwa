# BANWA: A DIGITAL CIVIL WORK AND BUSINESS APPLICATION SYSTEM WITH A DECISION SUPPORT FOR BARANGAY BLUE RIDGE B

## Introduction
<p>
  The Digital Civil Work and Business Application System with Decision Support was developed to help barangays and local government units (LGUs) manage services more efficiently. Many offices still use manual processes for handling civil work requests, business clearances, and utility services, which can cause delays, disorganized records, and communication problems.
  
  The system improves these processes by digitalizing workflows, organizing records, speeding up transactions, and improving communication between residents and officials.
  
  Studies show that digital systems and decision support tools help local governments provide faster, more accurate, and more organized services. Research also shows that AI-based systems can support better decision-making by analyzing data, public feedback, and legal requirements.
  
  Overall, the proposed system helps barangays and LGUs improve efficiency, service quality, and decision-making.
</p>

---

## Get Started

### Need to be installed:
- Visual Studio Code
- Docker Desktop 28.5.1
- Git 2.50.0
- Node.js 22.16.0
- PGAdmin 4 9.12
- PHP 8.5.0

---

## Setup

### 1. Clone and build

```bash
git clone <repo_url>
cd Banwa
docker compose up --build -d
```

### Restart containers (without rebuild)

```bash
docker compose up -d
```

---

### 2. Socket.IO server

```bash
cd server/socketio
npm install
node server.js
```
