// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ChampionTypes.sol";

/**
 * @title BattleEngine
 * @notice Pure library that simulates a full turn-based battle between two champions.
 *
 * Rules:
 *  - Higher speed goes first; ties broken by unitA.
 *  - Each turn: tick DoT → check stun → attempt ability (once per battle) OR normal attack.
 *  - Curupira ability "Pés Invertidos": +60% DEF for 2 turns + weaken enemy (−20% ATK).
 *  - Iara ability "Canto Sedutor": stun enemy 1 turn + heal self 45 HP.
 *  - Boitatá ability "Olhar de Brasa": apply 18 burn/turn for 4 turns + 20 instant.
 *  - Anhangá ability "Caçada Sombria": next attack ×2.5, bypasses 50% enemy DEF.
 *  - Tupã ability "Tempestade Elétrica": 65 flat damage + stun 1 turn.
 *  - Max 30 turns; if both alive → higher HP wins.
 *  - Randomness from a seed (block.prevrandao ^ playerAddresses XOR).
 */
library BattleEngine {
    using ChampionTypes for ChampionTypes.Class;

    uint8  private constant MAX_TURNS     = 30;
    uint16 private constant SCALE         = 10_000; // basis-point denominator

    // ─── Public entry point ───────────────────────────────────────────────────

    /**
     * @notice Simulate a complete battle.
     * @param a    BattleUnit for player A (initialized from ChampionTypes.getBaseStats)
     * @param b    BattleUnit for player B
     * @param seed Pseudo-random seed (e.g. block.prevrandao ^ packed addresses)
     * @return winner 0 = unitA wins, 1 = unitB wins
     * @return turns  Number of turns played
     */
    function simulate(
        ChampionTypes.BattleUnit memory a,
        ChampionTypes.BattleUnit memory b,
        uint256 seed
    ) internal pure returns (uint8 winner, uint8 turns) {
        bool aFirst = a.speed >= b.speed;

        for (uint8 t = 0; t < MAX_TURNS; t++) {
            seed = _nextSeed(seed, t);

            if (aFirst) {
                if (!_processTurn(a, b, seed))       break;
                seed = _nextSeed(seed, t + 100);
                if (!_processTurn(b, a, seed ^ 1))   break;
            } else {
                if (!_processTurn(b, a, seed))        break;
                seed = _nextSeed(seed, t + 100);
                if (!_processTurn(a, b, seed ^ 1))   break;
            }
            turns = t + 1;
        }

        // Determine winner
        if (a.currentHp == 0 && b.currentHp == 0) {
            winner = a.speed >= b.speed ? 0 : 1; // speed tiebreak on draw
        } else if (b.currentHp == 0) {
            winner = 0;
        } else if (a.currentHp == 0) {
            winner = 1;
        } else {
            // Max turns reached – higher HP percentage wins
            winner = (uint32(a.currentHp) * 1000 / a.attack) >=
                     (uint32(b.currentHp) * 1000 / b.attack) ? 0 : 1;
        }
    }

    // ─── Turn processor ───────────────────────────────────────────────────────

    /**
     * @dev Process one turn for `attacker` against `defender`.
     * @return stillAlive false if defender dies this turn
     */
    function _processTurn(
        ChampionTypes.BattleUnit memory attacker,
        ChampionTypes.BattleUnit memory defender,
        uint256 seed
    ) private pure returns (bool stillAlive) {

        // 1. Tick DoT on attacker (burn, etc.)
        if (attacker.dotTurns > 0) {
            uint16 dot = attacker.dotDamage;
            attacker.currentHp = attacker.currentHp > dot
                ? attacker.currentHp - dot : 0;
            attacker.dotTurns--;
            if (attacker.currentHp == 0) return false; // attacker dies of burn
        }

        // 2. Tick status durations
        if (attacker.statusTurns > 0) {
            attacker.statusTurns--;
            if (attacker.statusTurns == 0) attacker.status = ChampionTypes.StatusEffect.NONE;
        }
        if (attacker.defenseBuff > 0) attacker.defenseBuff--;

        // 3. Stun check — skip turn
        if (attacker.status == ChampionTypes.StatusEffect.STUNNED) {
            return true;
        }

        // 4. Decide: use ability (first eligible turn) or normal attack
        if (!attacker.abilityUsed && _shouldUseAbility(attacker, defender)) {
            attacker.abilityUsed = true;
            _applyAbility(attacker, defender);
        } else {
            _applyNormalAttack(attacker, defender, seed);
        }

        return defender.currentHp > 0;
    }

    // ─── Ability applications ─────────────────────────────────────────────────

    function _shouldUseAbility(
        ChampionTypes.BattleUnit memory self,
        ChampionTypes.BattleUnit memory enemy
    ) private pure returns (bool) {
        // Curupira: use when HP < 60%
        if (self.class_ == ChampionTypes.Class.CURUPIRA) {
            ChampionTypes.BaseStats memory base = ChampionTypes.getBaseStats(self.class_);
            return self.currentHp < (uint32(base.maxHp) * 60 / 100);
        }
        // Iara: use when HP < 50% or enemy not yet stunned
        if (self.class_ == ChampionTypes.Class.IARA) {
            ChampionTypes.BaseStats memory base = ChampionTypes.getBaseStats(self.class_);
            return self.currentHp < (uint32(base.maxHp) * 50 / 100)
                || enemy.status != ChampionTypes.StatusEffect.STUNNED;
        }
        // Boitatá: use on turn 1 (enemy not yet burning)
        if (self.class_ == ChampionTypes.Class.BOITATA) {
            return enemy.dotTurns == 0;
        }
        // Anhangá: use when enemy HP < 50%
        if (self.class_ == ChampionTypes.Class.ANHANGA) {
            ChampionTypes.BaseStats memory base = ChampionTypes.getBaseStats(enemy.class_);
            return enemy.currentHp < (uint32(base.maxHp) * 50 / 100);
        }
        // Tupã: always use asap
        return true;
    }

    function _applyAbility(
        ChampionTypes.BattleUnit memory self,
        ChampionTypes.BattleUnit memory enemy
    ) private pure {
        ChampionTypes.BaseStats memory base = ChampionTypes.getBaseStats(self.class_);

        if (self.class_ == ChampionTypes.Class.CURUPIRA) {
            // Pés Invertidos: +60% DEF for 2 turns + weaken enemy
            self.defenseBuff      = 2;
            self.defense          = uint16(uint32(self.defense) * (SCALE + base.defenseBuffBps) / SCALE);
            enemy.status          = ChampionTypes.StatusEffect.WEAKENED;
            enemy.statusTurns     = 2;
            enemy.attack          = uint16(uint32(enemy.attack) * 8000 / SCALE); // -20% ATK

        } else if (self.class_ == ChampionTypes.Class.IARA) {
            // Canto Sedutor: stun 1 turn + heal self
            enemy.status          = ChampionTypes.StatusEffect.STUNNED;
            enemy.statusTurns     = uint8(base.stunDurationTurns);
            uint16 healed         = base.abilityHeal;
            ChampionTypes.BaseStats memory selfBase = ChampionTypes.getBaseStats(self.class_);
            self.currentHp        = self.currentHp + healed > selfBase.maxHp
                                    ? selfBase.maxHp : self.currentHp + healed;

        } else if (self.class_ == ChampionTypes.Class.BOITATA) {
            // Olhar de Brasa: instant hit + burn DoT
            uint16 dmg = _calcDamage(base.abilityDamage, 0, enemy.defense);
            enemy.currentHp       = enemy.currentHp > dmg ? enemy.currentHp - dmg : 0;
            enemy.status          = ChampionTypes.StatusEffect.BURNED;
            enemy.dotDamage       = uint8(base.dotDamagePerTurn);
            enemy.dotTurns        = base.dotDurationTurns;

        } else if (self.class_ == ChampionTypes.Class.ANHANGA) {
            // Caçada Sombria: 2.5× attack, ignore 50% DEF
            uint16 halfDef        = enemy.defense / 2;
            uint16 rawDmg         = uint16(uint32(self.attack) * 25 / 10); // ×2.5
            uint16 dmg            = _calcDamage(rawDmg, 0, halfDef);
            enemy.currentHp       = enemy.currentHp > dmg ? enemy.currentHp - dmg : 0;

        } else {
            // Tupã Tempestade Elétrica: 65 flat + stun 1 turn
            uint16 dmg            = _calcDamage(base.abilityDamage, 0, enemy.defense);
            enemy.currentHp       = enemy.currentHp > dmg ? enemy.currentHp - dmg : 0;
            enemy.status          = ChampionTypes.StatusEffect.STUNNED;
            enemy.statusTurns     = uint8(base.stunDurationTurns);
        }
    }

    // ─── Normal attack ────────────────────────────────────────────────────────

    function _applyNormalAttack(
        ChampionTypes.BattleUnit memory attacker,
        ChampionTypes.BattleUnit memory defender,
        uint256 seed
    ) private pure {
        // Dodge check
        uint16 dodgeRoll = uint16(seed % SCALE);
        if (dodgeRoll < defender.dodgeBps) return; // miss

        // Crit check
        uint16 critRoll  = uint16((seed >> 32) % SCALE);
        bool   isCrit    = critRoll < attacker.critBps;

        uint16 atkPow    = isCrit
            ? uint16(uint32(attacker.attack) * 175 / 100)  // 1.75× on crit
            : attacker.attack;

        uint16 dmg = _calcDamage(atkPow, 0, defender.defense);
        if (dmg == 0) dmg = 1; // always deal at least 1

        defender.currentHp = defender.currentHp > dmg ? defender.currentHp - dmg : 0;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /// @dev Damage = max(1, attack − defense × 0.6)
    function _calcDamage(
        uint16 atk,
        uint16 /*unused_flat*/,
        uint16 def
    ) private pure returns (uint16) {
        uint32 reduction = uint32(def) * 60 / 100;
        return uint32(atk) > reduction ? uint16(uint32(atk) - reduction) : 1;
    }

    function _nextSeed(uint256 seed, uint8 nonce) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed, nonce)));
    }

    // ─── View helper: build BattleUnit from class and owner ───────────────────

    function buildUnit(
        ChampionTypes.Class class_,
        address owner
    ) internal pure returns (ChampionTypes.BattleUnit memory u) {
        ChampionTypes.BaseStats memory s = ChampionTypes.getBaseStats(class_);
        u = ChampionTypes.BattleUnit({
            class_:       class_,
            owner:        owner,
            currentHp:    s.maxHp,
            attack:       s.attack,
            defense:      s.defense,
            speed:        s.speed,
            critBps:      s.critBps,
            dodgeBps:     s.dodgeBps,
            status:       ChampionTypes.StatusEffect.NONE,
            dotDamage:    0,
            dotTurns:     0,
            statusTurns:  0,
            abilityUsed:  false,
            defenseBuff:  0
        });
    }
}
