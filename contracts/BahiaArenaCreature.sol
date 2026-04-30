// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BahiaArenaCreature
 * @notice ERC-721 NFT representing creatures in the Bahia Arena game.
 *         Minting is paid in cUSD (or configured stablecoin).
 *         Stats are stored on-chain for battle resolution.
 */
contract BahiaArenaCreature is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum Element { FIRE, WATER, EARTH, WIND, LIGHTNING }

    struct CreatureStats {
        uint16 hp;        // max hit points
        uint16 attack;    // base attack power
        uint16 defense;   // base defense power
        uint16 speed;     // determines turn order
        uint8  level;     // 1-100
        Element element;
        bool   inBattle;  // locked during active battle
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    uint256 public nextTokenId;
    uint256 public mintPrice;            // in stablecoin (6 decimals, e.g. cUSD)
    IERC20  public paymentToken;         // cUSD or USDT
    address public arenaManager;         // ArenaManager contract – can lock creatures
    string  public baseTokenURI;

    mapping(uint256 => CreatureStats) public creatureStats;

    // Predefined base stats per element (tunable by owner)
    mapping(Element => CreatureStats) public baseStats;

    // ─── Events ────────────────────────────────────────────────────────────────

    event CreatureMinted(address indexed owner, uint256 indexed tokenId, Element element);
    event CreatureLevelUp(uint256 indexed tokenId, uint8 newLevel);
    event BattleLockSet(uint256 indexed tokenId, bool locked);
    event MintPriceUpdated(uint256 newPrice);
    event ArenaManagerUpdated(address newManager);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error InsufficientPayment();
    error CreatureInBattle();
    error NotArenaManager();
    error InvalidElement();
    error MaxLevelReached();

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address _paymentToken,
        uint256 _mintPrice,
        string memory _baseTokenURI
    ) ERC721("Bahia Arena Creature", "BAHIA") Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        mintPrice    = _mintPrice;
        baseTokenURI = _baseTokenURI;
        _initBaseStats();
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyArenaManager() {
        if (msg.sender != arenaManager) revert NotArenaManager();
        _;
    }

    // ─── Public: Minting ───────────────────────────────────────────────────────

    /**
     * @notice Mint a new creature. Caller must have approved `mintPrice` cUSD.
     * @param element Chosen element for the creature (0-4)
     * @param uri     IPFS metadata URI
     */
    function mintCreature(Element element, string calldata uri)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        paymentToken.safeTransferFrom(msg.sender, address(this), mintPrice);

        tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        CreatureStats memory base = baseStats[element];
        // Apply a small random seed based on block data for variation
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, tokenId)));
        creatureStats[tokenId] = CreatureStats({
            hp:        base.hp      + uint16(seed % 20),
            attack:    base.attack  + uint16((seed >> 8) % 10),
            defense:   base.defense + uint16((seed >> 16) % 10),
            speed:     base.speed   + uint16((seed >> 24) % 10),
            level:     1,
            element:   element,
            inBattle:  false
        });

        emit CreatureMinted(msg.sender, tokenId, element);
    }

    // ─── ArenaManager: Lock/Unlock ─────────────────────────────────────────────

    function lockCreature(uint256 tokenId) external onlyArenaManager {
        creatureStats[tokenId].inBattle = true;
        emit BattleLockSet(tokenId, true);
    }

    function unlockCreature(uint256 tokenId) external onlyArenaManager {
        creatureStats[tokenId].inBattle = false;
        emit BattleLockSet(tokenId, false);
    }

    // ─── Owner: Admin ──────────────────────────────────────────────────────────

    function setArenaManager(address _manager) external onlyOwner {
        arenaManager = _manager;
        emit ArenaManagerUpdated(_manager);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
        emit MintPriceUpdated(_price);
    }

    function setBaseTokenURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
    }

    function withdrawFunds(address to) external onlyOwner {
        uint256 bal = paymentToken.balanceOf(address(this));
        paymentToken.safeTransfer(to, bal);
    }

    // ─── View ──────────────────────────────────────────────────────────────────

    function getStats(uint256 tokenId) external view returns (CreatureStats memory) {
        return creatureStats[tokenId];
    }

    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory ids = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = tokenOfOwnerByIndex(owner, i);
        }
        return ids;
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _initBaseStats() internal {
        baseStats[Element.FIRE]      = CreatureStats(120, 30, 15, 20, 1, Element.FIRE,      false);
        baseStats[Element.WATER]     = CreatureStats(130, 20, 25, 18, 1, Element.WATER,     false);
        baseStats[Element.EARTH]     = CreatureStats(150, 25, 30, 12, 1, Element.EARTH,     false);
        baseStats[Element.WIND]      = CreatureStats(110, 28, 18, 30, 1, Element.WIND,      false);
        baseStats[Element.LIGHTNING] = CreatureStats(115, 35, 12, 28, 1, Element.LIGHTNING, false);
    }

    // ─── ERC-721 overrides ─────────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // Prevent transfer while in battle
        if (creatureStats[tokenId].inBattle && to != address(0)) revert CreatureInBattle();
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
