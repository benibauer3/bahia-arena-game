// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IAaveV3Pool
 * @notice Minimal interface for Aave V3 Pool on Celo Mainnet.
 * @dev    Pool Proxy (Celo Mainnet): 0x794a61358D6845594F94dc1DB02A252b5b4814aD
 *         Full interface: https://github.com/aave/aave-v3-core/blob/master/contracts/interfaces/IPool.sol
 */
interface IAaveV3Pool {
    // ─── Supply ───────────────────────────────────────────────────────────────

    /**
     * @notice Supplies an `amount` of underlying asset into the reserve,
     *         receiving in return overlying aTokens.
     *         E.g. User supplies 100 USDT and gets in return 100 aUSDT.
     * @param asset         The address of the underlying asset to supply
     * @param amount        The amount to be supplied (in asset token decimals)
     * @param onBehalfOf    Address that will receive the aTokens — use address(this)
     * @param referralCode  0 for no referral
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    // ─── Withdraw ─────────────────────────────────────────────────────────────

    /**
     * @notice Withdraws an `amount` of underlying asset from the reserve,
     *         burning the equivalent aTokens owned by `msg.sender`.
     *         E.g. User has 100 aUSDT, calls withdraw() and burns 100 aUSDT,
     *              receiving 100 USDT.
     * @param asset  The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn.
     *               Use type(uint256).max to withdraw the entire aToken balance.
     * @param to     The address that will receive the underlying asset
     * @return       The final amount withdrawn (may differ from `amount` due to rounding)
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    // ─── View ─────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the normalized income of the reserve (liquidity index × ray).
     *         Used to compute the current value of aTokens.
     * @param asset The address of the underlying asset
     * @return      The reserve's normalized income in RAY (1e27)
     */
    function getReserveNormalizedIncome(address asset) external view returns (uint256);

    /**
     * @notice Returns the reserve data for a given asset.
     * @param asset The address of the underlying asset
     */
    function getReserveData(address asset)
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 currentLiquidityRate,
            uint128 variableBorrowIndex,
            uint128 currentVariableBorrowRate,
            uint128 currentStableBorrowRate,
            uint40  lastUpdateTimestamp,
            uint16  id,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint128 accruedToTreasury,
            uint128 unbacked,
            uint128 isolationModeTotalDebt
        );
}
