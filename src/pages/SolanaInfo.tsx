import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import solanaLogo from "@/assets/solana-logo.jpg";

// Generate wallet list data
const generateWalletList = () => {
  const wallets = [];
  const today = new Date();
  
  for (let i = 0; i < 12847; i++) {
    // Generate random wallet address
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let address = '';
    for (let j = 0; j < 44; j++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Random amount between 0.5 and 15 SOL
    const amount = (Math.random() * (15 - 0.5) + 0.5).toFixed(2);
    
    // Date logic: first 8 get today, rest go backwards
    let date;
    if (i < 8) {
      date = today;
    } else {
      const daysBack = Math.floor(Math.random() * 400) + 1; // Random days back to 2024
      date = new Date(today);
      date.setDate(date.getDate() - daysBack);
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    wallets.push({ address, amount, date: dateStr });
  }
  
  return wallets;
};

const SolanaInfo = () => {
  const [walletList] = useState(() => generateWalletList());
  return <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold text-white">Back to Home</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Logo Header */}
          <div className="text-center mb-12">
            <div className="mb-8 inline-block animate-float">
              <div className="relative bg-[#3137a3] rounded">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 blur-2xl opacity-50 animate-pulse"></div>
                <img src={solanaLogo} alt="Solana" className="relative h-32 w-32 mx-auto rounded-full border-4 border-primary/50 shadow-[0_0_50px_rgba(59,130,246,0.8)]" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl mb-6 gradient-primary bg-clip-text font-light text-[#2d50a2]">
              Solana Program
            </h1>
          </div>

          {/* Introduction Section */}
          <div className="glass-card rounded-2xl p-8 mb-8 text-[#314ceb] font-bold text-4xl">
            <h2 className="text-3xl font-bold text-white mb-4">Introduction to Solana</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Solana is a high-performance blockchain platform designed for decentralized applications and crypto-currencies. 
              Founded by Anatoly Yakovenko in 2017, Solana aims to solve the blockchain trilemma by achieving scalability, 
              security, and decentralization simultaneously. With its innovative Proof of History (PoH) consensus mechanism 
              combined with Proof of Stake (PoS), Solana can process up to 65,000 transactions per second with sub-second 
              finality and extremely low transaction costs, typically fractions of a cent.
            </p>
          </div>

          {/* Live Chart */}
          <div className="glass-card rounded-2xl p-4 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Live Solana Price Chart</h3>
            <div className="w-full" style={{
            height: "500px"
          }}>
              <iframe src="https://dexscreener.com/solana/7qbrgggytqagffgeywksryz7nbzvbhjwyatpgh1pump?embed=1&theme=dark&trades=0&info=0" className="w-full h-full rounded-xl border-2 border-primary/30" title="Solana Price Chart" />
            </div>
          </div>

          {/* Detailed Content Sections */}
          <div className="space-y-8">
            {/* Core Technology */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Core Technology and Innovation</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solana's groundbreaking architecture is built on eight core innovations that work together to create 
                a blockchain capable of processing transactions at speeds comparable to centralized systems. The most 
                notable innovation is Proof of History (PoH), a cryptographic clock that allows nodes to agree on the 
                time and order of events without waiting for messages from other nodes. This dramatically reduces latency 
                and increases throughput.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The platform uses Tower BFT, a PoH-optimized version of Practical Byzantine Fault Tolerance (PBFT), 
                which leverages the synchronized clock to reach consensus faster. Turbine is Solana's block propagation 
                protocol that breaks data into smaller packets, making it easier for validators to transmit information 
                across the network. Gulf Stream pushes transaction caching and forwarding to the edge of the network, 
                allowing validators to execute transactions ahead of time.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sealevel is Solana's parallel smart contracts runtime that enables thousands of contracts to run 
                concurrently. Pipelining is a Transaction Processing Unit that optimizes validation by assigning 
                different stages of transaction validation to different hardware. Cloudbreak is Solana's horizontally-scaled 
                accounts database, and Archivers are Solana's distributed ledger store. Together, these innovations 
                create a blockchain that can scale with Moore's Law, becoming faster as hardware improves.
              </p>
            </div>

            {/* Ecosystem */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">The Solana Ecosystem</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Solana ecosystem has grown exponentially since its mainnet launch in March 2020. Today, it hosts 
                thousands of projects spanning DeFi, NFTs, gaming, payments, and more. Major decentralized exchanges 
                like Serum, Raydium, and Orca provide liquidity and trading services with minimal slippage and fees. 
                The NFT ecosystem on Solana has exploded with marketplaces like Magic Eden, Solanart, and Digital Eyes 
                facilitating billions in trading volume.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DeFi protocols on Solana offer yield farming, lending, borrowing, and synthetic assets with speeds 
                and costs that rival centralized finance. Projects like Marinade Finance offer liquid staking solutions, 
                allowing users to stake their SOL while maintaining liquidity. Phantom, Solflare, and other wallets 
                provide secure and user-friendly interfaces for interacting with the Solana blockchain.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The gaming sector on Solana is particularly vibrant, with play-to-earn games, metaverse projects, and 
                GameFi platforms choosing Solana for its speed and low costs. Web3 social media platforms, music streaming 
                services, and even decentralized ride-sharing apps are being built on Solana, showcasing the blockchain's 
                versatility beyond financial applications.
              </p>
            </div>

            {/* Solana Airdrops Section */}
            <div className="glass-card rounded-2xl p-8 border-2 border-primary/50">
              <h2 className="text-3xl font-bold text-white mb-4">Solana Airdrops: Community Rewards and Distribution</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Airdrops have become an integral part of the Solana ecosystem, serving as a mechanism for projects to 
                distribute tokens to early adopters, reward community members, and bootstrap network effects. Unlike 
                traditional token sales, airdrops provide free tokens to eligible wallets based on specific criteria 
                such as holding certain NFTs, using particular protocols, or participating in governance.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Solana ecosystem has seen numerous successful airdrops. Projects often reward users who interacted 
                with their protocols before token launches, creating retroactive rewards for early believers. Common 
                airdrop criteria include holding specific NFT collections, providing liquidity to DEXs, participating 
                in testnet activities, or completing social media tasks. Some airdrops require users to claim tokens 
                actively, while others automatically deposit tokens into eligible wallets.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To be eligible for Solana airdrops, users typically need to maintain an active wallet with a small 
                amount of SOL for transaction fees. Participating in the ecosystem by using various protocols, holding 
                blue-chip NFTs, and engaging with project communities increases the likelihood of receiving airdrops. 
                It's important to note that while airdrops can provide significant value, users should always verify 
                the legitimacy of airdrop announcements through official channels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Popular airdrop strategies include "airdrop farming" where users interact with multiple promising 
                protocols hoping for future token distributions. However, this should be approached cautiously, as 
                there's no guarantee of airdrops, and genuine engagement with projects you believe in is always more 
                rewarding than mercenary farming. Many successful Solana projects have used airdrops not just for 
                distribution but to align incentives and build strong, engaged communities.
              </p>
            </div>

            {/* SPL Tokens */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">SPL Tokens: The Standard for Solana Assets</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SPL (Solana Program Library) tokens are the standard for fungible and non-fungible tokens on the Solana 
                blockchain. Similar to Ethereum's ERC-20 standard, SPL tokens enable developers to create custom tokens 
                with various properties and functionalities. The SPL Token program provides the foundation for creating 
                and managing these tokens, with support for features like token minting, burning, freezing, and transferring.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Creating an SPL token is straightforward and cost-effective on Solana. Developers can mint tokens with 
                customizable supply, decimal places, and metadata. The SPL Token-2022 program introduces additional 
                features like transfer fees, interest-bearing tokens, and confidential transfers. This flexibility has 
                led to thousands of SPL tokens being created for various use cases, from stablecoins to governance tokens.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Popular SPL tokens include USDC (USD Coin), a stablecoin issued by Circle; various DEX tokens like RAY 
                (Raydium) and ORCA (Orca); and project-specific tokens. The low transaction costs on Solana make it 
                practical to use SPL tokens for everyday transactions, micro-payments, and high-frequency trading, 
                use cases that would be prohibitively expensive on other blockchains.
              </p>
            </div>

            {/* Staking and Validation */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Staking and Network Validation</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solana uses a Proof of Stake consensus mechanism where validators stake SOL tokens to participate in 
                consensus and earn rewards. The network has over 1,900 validators, making it one of the most decentralized 
                blockchains. Validators are responsible for processing transactions, maintaining the blockchain, and 
                participating in consensus. They earn rewards in the form of inflation rewards and transaction fees.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SOL holders can participate in network security and earn rewards through delegation. By delegating 
                their SOL to validators, users earn a portion of the validator's rewards without needing to run 
                validator infrastructure. Staking rewards typically range from 5-7% APY, depending on the validator's 
                performance and commission rate. Delegators should consider validator uptime, commission rates, and 
                voting history when choosing validators.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Liquid staking solutions like Marinade Finance and Lido allow users to stake SOL while maintaining 
                liquidity through derivative tokens (mSOL, stSOL). These liquid staking tokens can be used in DeFi 
                protocols, providing additional yield opportunities while supporting network security. The minimum 
                stake amount is flexible, and there's no lock-up period, though it takes 2-3 days to unstake and 
                receive your SOL back.
              </p>
            </div>

            {/* Developer Experience */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Developer Experience and Tools</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solana provides an exceptional developer experience with comprehensive documentation, robust tooling, 
                and an active community. Programs (smart contracts) on Solana are primarily written in Rust, though 
                C and C++ are also supported. The Anchor framework simplifies Solana program development by providing 
                abstractions and best practices, making it easier for developers to build secure and efficient programs.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Solana CLI offers powerful tools for interacting with the blockchain, deploying programs, and 
                managing wallets. Web developers can use the Solana Web3.js library to build frontend applications 
                that interact with Solana programs. The Solana Playground provides a browser-based IDE for learning 
                and experimenting with Solana development without local setup.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Developer resources include extensive documentation, tutorials, and example projects. The Solana 
                Foundation runs hackathons, provides grants, and offers educational programs to support developers 
                building on Solana. The community is active on Discord, forums, and Stack Exchange, providing support 
                and collaboration opportunities for developers of all skill levels.
              </p>
            </div>

            {/* Security and Resilience */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Security, Audits, and Network Resilience</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Security is paramount in the Solana ecosystem. Programs undergo rigorous auditing by firms like Kudelski 
                Security, Trail of Bits, and Neodyme before deployment. The Solana Foundation runs a bug bounty program 
                rewarding researchers who discover and responsibly disclose vulnerabilities. The network has demonstrated 
                resilience through various stress tests and has continuously improved its stability.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                While Solana has experienced network congestion and downtime in its early years, the core developers 
                have worked tirelessly to improve network stability. Upgrades like QUIC protocol implementation, fee 
                market improvements, and stake-weighted quality of service have significantly enhanced network resilience. 
                The team's transparent communication during incidents and rapid response to issues demonstrate their 
                commitment to reliability.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For users, security best practices include using hardware wallets, verifying transaction details before 
                signing, and being cautious of phishing attempts. The rent-exempt minimum (currently around 0.00089088 SOL) 
                ensures that accounts remain on the blockchain, preventing state bloat while maintaining accessibility. 
                Understanding these mechanisms helps users interact safely with the Solana network.
              </p>
            </div>

            {/* Future and Roadmap */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Future Developments and Roadmap</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solana's roadmap includes ambitious goals for further improving scalability, security, and usability. 
                Upcoming features include Firedancer, an independent validator client being developed by Jump Crypto 
                that could increase network capacity to 1 million transactions per second. Confidential transfers will 
                enable privacy-preserving transactions on Solana, expanding use cases for enterprises and privacy-conscious 
                users.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Solana Mobile Stack (SMS) and Saga phone represent efforts to bring Web3 to mobile devices with 
                native blockchain integration. Token extensions in SPL Token-2022 enable new token functionalities like 
                interest-bearing assets and automatic compliance features. Cross-chain bridges and interoperability 
                solutions continue to improve, allowing seamless asset transfers between Solana and other blockchains.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The community governance framework is evolving, giving SOL holders more say in network upgrades and 
                parameter changes. As the ecosystem matures, we can expect more institutional adoption, regulatory 
                clarity, and integration with traditional finance systems. Solana's commitment to remaining at the 
                cutting edge of blockchain technology positions it as a leading platform for the next generation of 
                decentralized applications.
              </p>
            </div>

            {/* Conclusion */}
            <div className="glass-card rounded-2xl p-8 border-2 border-primary/50">
              <h2 className="text-3xl font-bold text-white mb-4">Conclusion: The Future is Fast</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solana represents a paradigm shift in blockchain technology, proving that decentralization doesn't 
                require sacrificing speed or affordability. With its innovative architecture, thriving ecosystem, and 
                committed community, Solana is well-positioned to power the next wave of blockchain adoption. Whether 
                you're a developer building the future of finance, a creator minting NFTs, or a user exploring Web3, 
                Solana offers a platform that combines performance with principles.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                As the blockchain industry evolves, Solana's focus on scalability, developer experience, and user 
                accessibility sets it apart. The network continues to mature, learning from challenges and emerging 
                stronger. For anyone interested in blockchain technology, Solana offers an exciting glimpse into what's 
                possible when innovation meets execution. The future of decentralized applications is being built on 
                Solana today.
              </p>
            </div>
          </div>

          {/* Wallet Transaction List */}
          <div id="wallet-list" className="glass-card rounded-2xl p-8 mb-8 mt-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Recent Claims</h2>
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur">
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Wallet Address</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Amount</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletList.map((wallet, index) => (
                      <tr key={index} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-4 text-white font-mono text-sm">
                          {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-right text-primary font-semibold">
                          {wallet.amount} SOL
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground text-sm">
                          {wallet.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-border/50">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">© 2024 Solana Educational Resource. Learn more at solana.com</p>
        </div>
      </footer>
    </div>;
};
export default SolanaInfo;