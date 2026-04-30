// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libs/ChampionTypes.sol";

/**
 * @title BahiaChampion
 * @notice Soulbound (non-transferable) ERC-721 representing the 5 Bahia Arena champions.
 *
 *  - Tokens are minted by ArenaManager when a player deposits the entry fee.
 *  - Tokens are burned by ArenaManager when a player withdraws.
 *  - Each player receives exactly one token per class (indices 0-4).
 *  - Transfer is permanently disabled (EIP-5192 soulbound).
 *
 * Token ID encoding:  tokenId = (uint160(owner) << 3) | uint8(class)
 * This makes each player's 5 champions deterministic and collision-free.
 */
contract BahiaChampion is ERC721, Ownable {
    using ChampionTypes for ChampionTypes.Class;

    // ─── State ─────────────────────────────────────────────────────────────────

    address public arenaManager;
    string  public baseURI;

    // champion metadata per tokenId
    mapping(uint256 => ChampionTypes.Class) public tokenClass;

    // ─── Events ────────────────────────────────────────────────────────────────

    /// @dev EIP-5192
    event Locked(uint256 indexed tokenId);
    event Unlocked(uint256 indexed tokenId);
    event ArenaManagerUpdated(address manager);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error Soulbound();
    error NotArenaManager();
    error AlreadyHasChampion(uint8 class_);
    error DoesNotHaveChampion(uint8 class_);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(string memory initialBaseURI)
        ERC721("Bahia Arena Champion", "BAHIAC")
        Ownable(msg.sender)
    {
        baseURI = initialBaseURI;
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyArenaManager() {
        if (msg.sender != arenaManager) revert NotArenaManager();
        _;
    }

    // ─── ArenaManager: Mint / Burn ─────────────────────────────────────────────

    /**
     * @notice Mint all 5 champions to `player`. Called on deposit.
     */
    function mintSet(address player) external onlyArenaManager {
        for (uint8 i = 0; i < 5; i++) {
            uint256 id = _encodeId(player, i);
            if (_ownerOf(id) != address(0)) revert AlreadyHasChampion(i);
            tokenClass[id] = ChampionTypes.Class(i);
            _mint(player, id);
            emit Locked(id);
        }
    }

    /**
     * @notice Burn all 5 champions from `player`. Called on withdrawal.
     */
    function burnSet(address player) external onlyArenaManager {
        for (uint8 i = 0; i < 5; i++) {
            uint256 id = _encodeId(player, i);
            if (_ownerOf(id) == address(0)) revert DoesNotHaveChampion(i);
            emit Unlocked(id);
            _burn(id);
        }
    }

    // ─── View ──────────────────────────────────────────────────────────────────

    function tokenIdOf(address player, ChampionTypes.Class class_)
        external pure returns (uint256)
    {
        return _encodeId(player, uint8(class_));
    }

    function hasChampionSet(address player) external view returns (bool) {
        return _ownerOf(_encodeId(player, 0)) == player;
    }

    function getChampionInfo(uint256 tokenId)
        external
        view
        returns (
            ChampionTypes.Class class_,
            string memory name,
            string memory ability,
            ChampionTypes.BaseStats memory stats
        )
    {
        class_  = tokenClass[tokenId];
        name    = ChampionTypes.className(class_);
        ability = ChampionTypes.abilityName(class_);
        stats   = ChampionTypes.getBaseStats(class_);
    }

    /// @dev EIP-5192: all tokens are locked forever
    function locked(uint256 /*tokenId*/) external pure returns (bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        // 0xb45a3c0e = EIP-5192 interfaceId
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    // ─── Owner ────────────────────────────────────────────────────────────────

    function setArenaManager(address _manager) external onlyOwner {
        arenaManager = _manager;
        emit ArenaManagerUpdated(_manager);
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
    }

    // ─── ERC-721: Block all transfers (soulbound) ─────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = _ownerOf(tokenId);
        // Allow mint (from == 0) and burn (to == 0) but no transfers
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _encodeId(address player, uint8 class_) internal pure returns (uint256) {
        return (uint256(uint160(player)) << 3) | uint256(class_);
    }
}
