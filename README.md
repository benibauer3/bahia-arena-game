
# Bahia Arena 🏟️  
**The Strategy Game on Celo.**

**Bahia Arena** redefines Web3 Gaming for emerging markets. Unlike traditional models, this is **not an NFT-based game**. We have eliminated the "Pay-to-Own" barrier to focus on accessibility and skill: users simply deposit **USDT (Celo)** to enter strategic battles and earn instant rewards. 

By leveraging the **Opera MiniPay** ecosystem, Bahia Arena offers a seamless, mobile-first experience for retail users, removing technical hurdles like minting or managing volatile secondary assets.

### 🌟 Key Strategic Pillars (Zero-NFT Policy)
*   **Direct Entry with USDT:** Deposit the stablecoin balance you already hold in **MiniPay** and enter the arena instantly.
*   **Free-to-Play Characters:** Upon entry, players gain access to a roster of legendary Brazilian mythological champions (Curupira, Boitatá, Iara, etc.) as base characters—no purchase required.
*   **Performance-Driven:** All financial logic is powered by USDT Escrow smart contracts, ensuring secure and rapid settlements on the Celo network.
*   **MiniPay Optimized:** A native mobile experience designed for the everyday user, featuring zero-friction onboarding and intuitive UI.

---

## 🏗️ Project Architecture

```bash
Bahia Arena - Game/
├── contracts/
│   ├── ArenaManager.sol         # USDT Escrow, Battle Logic & Reward Distribution
│   └── mocks/ERC20Mock.sol      # Test environment for USDT/cUSD
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useMiniPay.ts    # Opera MiniPay Detection & UX Optimization
│   │   │   └── useBattle.ts     # USDT-based Arena Entry Flow
│   │   └── pages/
│   │       └── Arena.tsx        # Mobile-first Battle Dashboard
└── hardhat.config.js
```

---

## ⚔️ Battle Mechanics (Skill-Based / Pay-per-Play)

The Bahia Arena model focuses on **capital utility** and player strategy:

1.  **Entry Deposit:** The player selects a battle room and deposits a set entry fee in USDT.
2.  **Strategic Equity:** Since there are no rare or expensive NFTs with superior stats, victory depends entirely on the player's strategy and the tactical use of the mythological champions' abilities.
3.  **Instant Settlement:** The winner of the round receives the total prize pool (minus a small protocol fee) directly into their MiniPay wallet in under 3 minutes.

---

## 🛠️ Installation Guide

### Prerequisites
*   Node.js >= 20
*   Metamask Wallet (Alfajores for testing)
*   USDT/USDm balance (Celo Mainnet or Testnet)

### Deploy & Setup
```bash
# Install dependencies
npm install

# Compile Arena Smart Contracts
npm run compile

# Deploy USDT Escrow Contract
npm run deploy:alfajores
```

### Dica Extra:
Se você for postar isso no LinkedIn ou no X, use essa versão em inglês para marcar os perfis oficiais da **Celo Foundation**, **Opera Crypto** e do **Talent Protocol**. Isso mostra que o projeto tem escala global, mesmo nascendo na Bahia! 🚀🌳
