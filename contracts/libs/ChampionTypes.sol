// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ChampionTypes
 * @notice Defines all types, enums and base stats for the 5 Bahia Arena champions.
 *         Drawn from Brazilian folklore: Curupira, Iara, Boitatá, Anhangá, Tupã.
 */
library ChampionTypes {

    // ─── Enums ────────────────────────────────────────────────────────────────

    /// @dev Champion class, index matches champion slot (0-4)
    enum Class {
        CURUPIRA,   // 0 — Tank
        IARA,       // 1 — Support
        BOITATA,    // 2 — DPS / DoT
        ANHANGA,    // 3 — Assassin
        TUPA        // 4 — Mage
    }

    enum StatusEffect {
        NONE,
        BURNED,    // takes dotDamage per turn (Boitatá)
        STUNNED,   // skips next turn (Tupã / Iara)
        CHARMED,   // attacks self (Iara advanced)
        WEAKENED   // reduced accuracy / -20% attack (Curupira)
    }

    // ─── Structs ──────────────────────────────────────────────────────────────

    /// @dev Immutable template stored per class
    struct BaseStats {
        uint16 maxHp;
        uint16 attack;
        uint16 defense;
        uint16 speed;
        uint16 critBps;         // crit chance in basis points (100 = 1%)
        uint16 dodgeBps;        // dodge chance in basis points
        // Ability metadata
        uint16 abilityDamage;   // flat damage dealt by ability
        uint16 abilityHeal;     // HP restored by ability
        uint16 dotDamagePerTurn;
        uint8  dotDurationTurns;
        uint8  stunDurationTurns;
        uint16 defenseBuffBps;  // temporary defense % increase (bps)
    }

    /// @dev Mutable state used during a battle simulation
    struct BattleUnit {
        Class   class_;
        address owner;
        uint16  currentHp;
        uint16  attack;
        uint16  defense;
        uint16  speed;
        uint16  critBps;
        uint16  dodgeBps;
        // Status
        StatusEffect status;
        uint8   dotDamage;
        uint8   dotTurns;
        uint8   statusTurns;   // remaining turns for current status effect
        // Ability
        bool    abilityUsed;
        uint8   defenseBuff;   // turns remaining on defense buff
    }

    // ─── Champion Templates (pure, no storage) ────────────────────────────────

    function getBaseStats(Class class_) internal pure returns (BaseStats memory s) {
        if (class_ == Class.CURUPIRA) {
            // Tank — high HP & DEF, 20% dodge (Pés Invertidos)
            s = BaseStats({
                maxHp:             200,
                attack:             22,
                defense:            45,
                speed:              12,
                critBps:           500,   // 5%
                dodgeBps:         2000,   // 20%
                abilityDamage:       0,
                abilityHeal:         0,
                dotDamagePerTurn:    0,
                dotDurationTurns:    0,
                stunDurationTurns:   0,
                defenseBuffBps:   6000    // +60% defense reduction for 2 turns
            });
        } else if (class_ == Class.IARA) {
            // Support — heal + stun (Canto Sedutor)
            s = BaseStats({
                maxHp:             160,
                attack:             25,
                defense:            30,
                speed:              18,
                critBps:          1000,   // 10%
                dodgeBps:         1000,
                abilityDamage:       0,
                abilityHeal:        45,   // heals 45 HP
                dotDamagePerTurn:    0,
                dotDurationTurns:    0,
                stunDurationTurns:   1,   // 1 turn stun
                defenseBuffBps:      0
            });
        } else if (class_ == Class.BOITATA) {
            // DPS/DoT — burn damage (Olhar de Brasa)
            s = BaseStats({
                maxHp:             150,
                attack:             40,
                defense:            20,
                speed:              22,
                critBps:          1500,   // 15%
                dodgeBps:          500,
                abilityDamage:      20,   // initial hit
                abilityHeal:         0,
                dotDamagePerTurn:   18,   // 18 per turn
                dotDurationTurns:    4,   // for 4 turns = 72 total
                stunDurationTurns:   0,
                defenseBuffBps:      0
            });
        } else if (class_ == Class.ANHANGA) {
            // Assassin — burst + backline focus (Caçada Sombria)
            s = BaseStats({
                maxHp:             120,
                attack:             55,
                defense:            15,
                speed:              35,
                critBps:          2500,   // 25%
                dodgeBps:         1500,
                abilityDamage:       0,   // multiplier applied in engine
                abilityHeal:         0,
                dotDamagePerTurn:    0,
                dotDurationTurns:    0,
                stunDurationTurns:   0,
                defenseBuffBps:      0
            });
        } else {
            // TUPA — Mage AoE stun (Tempestade Elétrica)
            s = BaseStats({
                maxHp:             140,
                attack:             45,
                defense:            18,
                speed:              28,
                critBps:          2000,   // 20%
                dodgeBps:          800,
                abilityDamage:      65,   // lightning bolt
                abilityHeal:         0,
                dotDamagePerTurn:    0,
                dotDurationTurns:    0,
                stunDurationTurns:   1,   // 1 turn stun
                defenseBuffBps:      0
            });
        }
    }

    /// @dev Human-readable ability name per class (gas-heavy; only used in views)
    function abilityName(Class class_) internal pure returns (string memory) {
        if (class_ == Class.CURUPIRA) return "Pes Invertidos";
        if (class_ == Class.IARA)     return "Canto Sedutor";
        if (class_ == Class.BOITATA)  return "Olhar de Brasa";
        if (class_ == Class.ANHANGA)  return "Cacada Sombria";
        return "Tempestade Eletrica";
    }

    function className(Class class_) internal pure returns (string memory) {
        if (class_ == Class.CURUPIRA) return "Curupira";
        if (class_ == Class.IARA)     return "Iara";
        if (class_ == Class.BOITATA)  return "Boitata";
        if (class_ == Class.ANHANGA)  return "Anhanga";
        return "Tupa";
    }
}
