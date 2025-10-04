import { TaskSweepingService } from '../src/services/sweeping.service';
import { SimulatedWalletService } from '../src/services/wallet.service';
import { describe, expect, it } from '@jest/globals';

describe('SweepingService - Extended Edge Cases', () => {
  it('should sweep all USDT into main wallet and handle all edge cases', async () => {
    const sweepGasFeeEth = 0.01;

    const walletService = new SimulatedWalletService(sweepGasFeeEth);

    const initialData: [number, number][] = [
      [0.1, 100], // Enough gas and tokens - should sweep
      [0.005, 80], // Not enough gas - no sweep (but gas top-up should happen then sweep)
      [0.01, 50], // Exactly enough gas - should sweep
      [0.02, 0], // Enough gas but zero USDT - no sweep, no gas deducted
      [0.02, 5], // Enough gas, small tokens - should sweep
      [0, 200], // No gas, but tokens - no sweep (but gas top-up should happen then sweep)
      [0.01, 0], // Exactly gas, zero token - no sweep
      [0.009, 10], // Just below gas, some token - no sweep (but gas top-up should happen then sweep)
      [0.05, 1000], // Big balance, enough gas - sweep
    ];

    // Create wallets
    const wallets = initialData.map(([eth, usdt]) =>
      walletService.createWallet(eth, usdt),
    );

    // Create main wallet
    // added 1 ETH to the main wallet to cover the gas fee for auxiliary wallets that doesnt have enough gas
    const mainWallet = walletService.createWallet(1, 0);

    // Sweeping service instance
    const sweepingService = new TaskSweepingService(
      walletService,
      mainWallet.id,
    );

    // Wallet ids to sweep from (excluding main)
    const walletIds = wallets.map((w) => w.id);

    // Perform sweeping
    await sweepingService.sweepAll(walletIds, mainWallet.id);

    // Helper to check if wallet should have swept:
    // condition: USDT > 0 (with gas top-up functionality, all wallets with USDT should be swept)
    const shouldSweep = (eth: number, usdt: number) =>
      usdt > 0;

    // Track total swept USDT for main wallet verification
    let totalSwept = 0;

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const [eth, usdt] = initialData[i];

      if (shouldSweep(eth, usdt)) {
        // Swept wallets should have zero USDT now
        expect(walletService.getBalance(wallet.id, 'USDT')).toBe(0);

        // ETH balance calculation depends on initial gas:
        let expectedEth;
        if (eth >= sweepGasFeeEth) {
          // Had sufficient gas initially - just deduct gas fee
          expectedEth = eth - sweepGasFeeEth;
        } else {
          // Had insufficient gas - topped up to exactly gas fee, then deducted gas fee
          expectedEth = 0;
        }
        
        expect(walletService.getBalance(wallet.id, 'ETH')).toBeCloseTo(
          expectedEth,
          8,
        );

        totalSwept += usdt;
      } else {
        // Wallets that didn't sweep keep their original balances
        expect(walletService.getBalance(wallet.id, 'USDT')).toBe(usdt);

        // ETH balance unchanged for those that did not sweep (no gas fee)
        expect(walletService.getBalance(wallet.id, 'ETH')).toBeCloseTo(eth, 8);
      }
    }

    // Main wallet should have sum of swept USDT
    expect(walletService.getBalance(mainWallet.id, 'USDT')).toBe(totalSwept);

    // Main wallet ETH balance: started with 1 ETH, used for gas top-ups and gas fees
    // Since we're doing gas top-ups, the main wallet should have less than 1 ETH
    const mainWalletEth = walletService.getBalance(mainWallet.id, 'ETH');
    expect(mainWalletEth).toBeLessThan(1); // Should have used some ETH for gas top-ups and fees
    expect(mainWalletEth).toBeGreaterThan(0); // Should still have some ETH remaining
  });
});
