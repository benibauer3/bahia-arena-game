# Bahia Arena 🏟️

Jogo de estratégia por turnos (estilo Axie Infinity) na blockchain Celo.  
Mobile-first, otimizado para MiniPay (Opera Browser).  
Pagamentos e recompensas 100% em cUSD.

---

## Estrutura do Projeto

```
Bahia Arena - Game/
├── contracts/
│   ├── BahiaArenaCreature.sol   # ERC-721 NFT com stats on-chain
│   ├── ArenaManager.sol         # Sistema de batalha + escrow
│   └── mocks/ERC20Mock.sol      # Mock cUSD para testes
├── scripts/
│   └── deploy.js                # Deploy + verificação Celoscan
├── test/
│   └── BahiaArena.test.js       # Suite de testes Hardhat
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── wagmiConfig.ts   # Chains Celo + Alfajores
│   │   │   └── contracts.ts     # ABIs + endereços por rede
│   │   ├── hooks/
│   │   │   ├── useMiniPay.ts    # Detecção do MiniPay
│   │   │   ├── useCreatures.ts  # Leitura de NFTs
│   │   │   └── useBattle.ts     # Batalhas (create/join/resolve)
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── CreatureCard.tsx
│   │   │   └── BattleCard.tsx
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Arena.tsx
│   │       └── Roster.tsx
│   └── package.json
├── hardhat.config.js
└── package.json
```

---

## Pré-requisitos

- Node.js >= 20  
- npm ou pnpm  
- Conta Celo com CELO para gas (gratuito no Alfajores via faucet)

---

## Setup – Contratos

```bash
# 1. Instalar dependências
cd "Bahia Arena - Game"
npm install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env
# PRIVATE_KEY=0x...   ← sua chave de deploy
# CELOSCAN_API_KEY=   ← opcional, para verificação

# 3. Compilar
npm run compile

# 4. Testes
npm test

# 5. Deploy no Alfajores (testnet)
npm run deploy:alfajores

# 6. Deploy na Mainnet Celo
npm run deploy:celo
```

O script de deploy escreve automaticamente os endereços em  
`frontend/src/lib/contracts.alfajores.json` (ou `.celo.json`).

**Faucet Alfajores:** https://faucet.celo.org/alfajores

---

## Setup – Frontend

```bash
cd "Bahia Arena - Game/frontend"
npm install

# Copiar .env
cp .env.example .env
# VITE_NETWORK=alfajores   (ou "celo" para mainnet)

# Após o deploy, atualizar os endereços em:
# src/lib/contracts.ts  →  CONTRACTS.alfajores.BahiaArenaCreature / ArenaManager

# Desenvolvimento
npm run dev

# Build produção
npm run build
```

---

## Arquitetura de Batalha (Híbrida)

```
Player A                  Smart Contract            Player B
   │                           │                       │
   │── createBattle() ────────>│                       │
   │   (approve cUSD + lock    │                       │
   │    creature no escrow)    │                       │
   │                           │<── joinBattle() ──────│
   │                           │    (idem)             │
   │                                                   │
   │           ◄── Batalha simulada off-chain ─────────│
   │                   (game server)                   │
   │                           │                       │
   │── resolveBattle() ────────│                       │
   │   (assinatura do oracle)  │                       │
   │                           │── payout cUSD ───────>│ (ou A ganha)
```

- **Gas**: ~0.001 CELO por transação (~$0.0004)
- **Liquidação**: < 30 segundos após submit do resultado
- **Fee do protocolo**: 2% do pot (configurável, máx 5%)

---

## Endereços de Tokens cUSD

| Rede       | Endereço                                     |
|------------|----------------------------------------------|
| Alfajores  | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| Mainnet    | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

---

## Detecção MiniPay

O hook `useMiniPay` verifica:
1. `window.ethereum.isMiniPay === true`
2. `navigator.userAgent.includes("MiniPay")`

Quando detectado, o botão de conexão exibe "Conectar MiniPay" e o banner verde aparece na Home.

---

## Próximos Passos

- [ ] Arte das criaturas (sprites por elemento)
- [ ] Sistema de ranking on-chain
- [ ] Torneios com pool de premiação
- [ ] Breeding de criaturas (EIP-2535 / extensão do ERC-721)
- [ ] Push notifications via MiniPay SDK quando batalha for resolvida
