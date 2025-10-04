# Changelog

All notable changes to this project will be documented in this file.

### Added
- **Sweep All Functionality**: Implemented comprehensive `sweepAll` function in `TaskSweepingService` to consolidate USDT funds from multiple auxiliary wallets into a main wallet
- **Gas Top-up Mechanism**: Added automatic gas top-up functionality to ensure auxiliary wallets have sufficient ETH for transaction fees during sweeping operations
- **Enhanced Error Handling**: Implemented robust error handling with detailed logging for failed sweep operations while maintaining operation continuity

### Changed
- **Test Configuration Enhancement**: Updated test parameters to initialize main wallet with 1 ETH to support gas top-up operations for auxiliary wallets
- **Wallet Service Logic**: Fixed transfer restriction in `SimulatedWalletService.send()` method (line 51) to properly validate token balances and enable successful fund transfers

### Technical Improvements
- **Gas Fee Management**: Improved gas fee calculation and validation logic to ensure optimal fund sweeping operations
- **Balance Validation**: Enhanced balance checking mechanism to handle edge cases in token transfer operations
- **Transaction Continuity**: Implemented skip logic to continue sweeping operations even when individual wallet operations fail

### Testing
- **Extended Test Coverage**: Added comprehensive test cases covering various edge cases including insufficient gas scenarios, zero balance wallets, and gas top-up functionality
- **Integration Testing**: Enhanced test suite to validate end-to-end sweeping operations with realistic wallet configurations
