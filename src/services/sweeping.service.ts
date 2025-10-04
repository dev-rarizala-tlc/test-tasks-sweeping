import { SimulatedWalletService, WalletId } from './wallet.service';

export interface SweepingService {
  /**
   * Sweep all funds from the user wallet to a specified address.
   * @param fromWalletId - Wallet to sweep from
   * @param toAddress - Target address for sweeping funds
   * @returns {Promise<SweepResult>}
   */
  sweepAll(walletIds: WalletId[], toAddress: WalletId): Promise<void>;
}

export class TaskSweepingService implements SweepingService {
  constructor(
    private walletService: SimulatedWalletService,
    private mainWalletId: string,
  ) {}

  /**
   * Tops up gas (ETH) from main wallet to a target wallet if needed
   * @param targetWalletId - Wallet that needs gas topup
   * @param mainWalletId - Main wallet to provide gas
   * @param requiredGas - Amount of gas needed
   * @returns {Promise<boolean>} - Returns true if topup was successful, false otherwise
   */
  private async topupGasFromMainWallet(
    targetWalletId: WalletId, 
    mainWalletId: WalletId, 
    requiredGas: number
  ): Promise<boolean> {
    const mainWalletEthBalance = this.walletService.getBalance(mainWalletId, 'ETH');
    
    // Check if main wallet has enough ETH to provide gas
    if (mainWalletEthBalance >= requiredGas) {
      try {
        // Transfer gas from main wallet to auxiliary wallet
        this.walletService.send(mainWalletId, targetWalletId, 'ETH', requiredGas);
        console.log(`Topped up ${requiredGas} ETH to wallet ${targetWalletId} for gas`);
        return true;
      } catch (error) {
        console.error(`Failed to top up gas for wallet ${targetWalletId}:`, error);
        return false;
      }
    } else {
      console.warn(`Main wallet has insufficient ETH (${mainWalletEthBalance}) to provide gas (${requiredGas}) for wallet ${targetWalletId}`);
      return false;
    }
  }

  async sweepAll(walletIds: WalletId[], toWalletId: WalletId): Promise<void> {

    // Get the gas fee from the wallet service
    const gasFee = 0.01; // Default gas fee from wallet service constructor
    const gasToken: 'ETH' = 'ETH';

    // Process each wallet to sweep
    for (const walletId of walletIds) {
      // Skip if this is the main wallet (toWalletId)
      if (walletId === toWalletId) {
        continue;
      }

      // Check if wallet has USDT tokens to sweep
      const usdtBalance = this.walletService.getBalance(walletId, 'USDT');
      
      // Only proceed if there are USDT tokens to sweep
      if (usdtBalance > 0) {
        
        // Check if wallet has sufficient ETH for gas
        let ethBalance = this.walletService.getBalance(walletId, 'ETH');
        
        // If wallet doesn't have sufficient gas, try to top up from main wallet
        if (ethBalance < gasFee) {
          const neededGas = gasFee - ethBalance;
          
          // Attempt to top up gas from main wallet
          const topupSuccess = await this.topupGasFromMainWallet(walletId, toWalletId, neededGas);
          
          if (!topupSuccess) {
            continue; // Skip this wallet if gas top-up fails
          }       
          // Update balance after successful top-up
          ethBalance = this.walletService.getBalance(walletId, 'ETH');
        }
        
        // Now attempt to sweep if we have sufficient gas
        if (ethBalance >= gasFee) {
          try {
            this.walletService.send(walletId, toWalletId, 'USDT', usdtBalance);
            console.log(`Successfully swept ${usdtBalance} USDT from wallet ${walletId}`);
          } catch (error) {
            // Handle any errors during sweeping (e.g., wallet not found)
            console.error(`Failed to sweep wallet ${walletId}:`, error);
            // Continue with other wallets even if one fails
          }
        }
      }
      //skip no value on the usdt wallet
    }
  }
}
