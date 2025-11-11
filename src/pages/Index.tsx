import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsCard from "@/components/StatsCard";
import { Wallet, Coins, Users, TrendingUp } from "lucide-react";
import solanaLogo from "@/assets/solana-logo.jpg";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={solanaLogo} alt="Solana" className="h-10 w-10" />
            <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Solana ClaimPool
            </span>
          </div>
          <Button 
            className="bg-solana-blue hover:bg-solana-blue/90 text-white font-semibold px-6 py-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="mb-8 inline-block animate-float">
            <img src={solanaLogo} alt="Solana" className="h-32 w-32 mx-auto drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 gradient-primary bg-clip-text text-transparent leading-tight">
            Claim Your Solana
            <br />
            Rewards Now
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of users claiming their SOL tokens. Fast, secure, and transparent on the Solana blockchain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="gradient-primary text-white font-bold px-12 py-7 rounded-xl text-lg hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] w-full sm:w-auto"
            >
              <Coins className="mr-2 h-6 w-6" />
              Claim Rewards
            </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-primary/50 bg-primary/10 text-white font-semibold px-12 py-7 rounded-xl text-lg hover:bg-primary/20 hover:border-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            Learn More
          </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <StatsCard 
            label="Total Value Locked" 
            value="$45.2M" 
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatsCard 
            label="Active Users" 
            value="12,847" 
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard 
            label="Total Claimed" 
            value="892K SOL" 
            icon={<Coins className="h-5 w-5" />}
          />
          <StatsCard 
            label="Reward Rate" 
            value="15.2% APY" 
            icon={<TrendingUp className="h-5 w-5" />}
          />
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
    </div>
  );
};

export default Index;
