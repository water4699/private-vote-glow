# 🗳️ Private Vote Glow - Privacy-Preserving Voting System

[![License: BSD-3-Clause-Clear](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](https://opensource.org/licenses/BSD-3-Clause-Clear)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://pro2-umber.vercel.app/)
[![FHEVM](https://img.shields.io/badge/Powered%20by-FHEVM-purple)](https://docs.zama.ai/fhevm)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.24-363636?logo=solidity)](https://docs.soliditylang.org/)

A privacy-preserving survey and voting system built with Fully Homomorphic Encryption (FHE) using the FHEVM protocol by Zama. This project enables secure, anonymous voting where individual votes remain encrypted throughout the entire process, ensuring complete privacy and data integrity.

## 🚀 Live Demo

**🌐 Deployed Application**: [https://pro2-umber.vercel.app/](https://pro2-umber.vercel.app/)

> **Try it now!** Connect your wallet and experience fully encrypted voting with complete privacy guarantees.

Experience the encrypted survey voting system in action. Connect your wallet and participate in privacy-preserving surveys with full end-to-end encryption.

## 🎥 Demo Video

Watch our demo video to see Private Vote Glow in action:

[📹 Demo Video](./vote.mp4) - Shows the complete voting workflow, from survey creation to encrypted vote submission and result decryption.

## 🔐 Key Features & Encryption Logic

### Application Features

The deployed application at [https://pro2-umber.vercel.app/](https://pro2-umber.vercel.app/) provides:

- 📊 **Survey Creation**: Contract owners can configure survey questions with multiple options
- 🗳️ **Encrypted Voting**: Users submit votes that remain encrypted on-chain
- 🔒 **Privacy-First Design**: Individual votes are never revealed, even to administrators
- 📈 **Result Decryption**: Authorized addresses can decrypt aggregated vote totals
- 🌐 **Wallet Integration**: Seamless connection via RainbowKit and MetaMask
- ⛓️ **Multi-Network Support**: Works on localhost, Sepolia testnet, and production networks

### Fully Homomorphic Encryption (FHE)
- **End-to-End Encryption**: All votes are encrypted on the client side before submission
- **Homomorphic Operations**: Vote tallying happens on encrypted data without decryption
- **Privacy Preservation**: Individual votes remain private even to contract administrators
- **Verifiable Results**: Only authorized addresses can decrypt aggregated results

### Data Encryption Flow

#### 1. **Vote Encryption (Client Side)**
```typescript
// User's vote is encrypted using FHEVM instance
const encryptedVote = await fhevmInstance.encrypt32(voteValue);
// encryptedVote contains: { data, signature }
```

#### 2. **On-Chain Storage (Smart Contract)**
```solidity
// Encrypted votes are accumulated homomorphically
euint32 voteValue = FHE.fromExternal(encryptedVote, inputProof);
option.encryptedTotal = FHE.add(option.encryptedTotal, voteValue);
```

#### 3. **Result Decryption (Authorized Only)**
```typescript
// Only addresses with granted permissions can decrypt
const decryptedResult = await fhevmInstance.decrypt(
  surveyAddress,
  encryptedTotal
);
```

### Security Guarantees

- ✅ **Vote Privacy**: Individual votes never exposed, even to contract owner
- ✅ **One Vote Per Address**: Smart contract enforces single submission per wallet
- ✅ **Tamper-Proof**: Blockchain immutability ensures vote integrity
- ✅ **Access Control**: Result decryption requires explicit permission grant
- ✅ **Zero-Knowledge Proofs**: Vote validity verified without revealing content

## 📜 Smart Contract Architecture

### EncryptedSurvey.sol

The core contract implements the following functionality:

**State Variables:**
- `surveyQuestion`: The question being asked
- `_options[]`: Array of survey options with encrypted vote totals
- `hasVoted`: Mapping to prevent double voting
- `isConfigured`: Survey setup status
- `isFinalized`: Survey closure status

**Key Functions:**

1. **configureSurvey(question, optionLabels)**: Initialize survey (owner only)
2. **submitVote(optionIndex, encryptedVote, inputProof)**: Submit encrypted vote
3. **finalizeSurvey()**: Close voting period (owner only)
4. **allowResultFor(grantee, optionIndex)**: Grant decryption permission
5. **getEncryptedTotal(optionIndex)**: Retrieve encrypted results
6. **hasVoterSubmitted(voter)**: Check if address has voted

**Encryption Implementation:**

```solidity
// Import FHEVM library for homomorphic operations
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

// Store votes as encrypted unsigned 32-bit integers
struct SurveyOption {
    string label;
    euint32 encryptedTotal;  // Encrypted vote count
}

// Add encrypted votes without decryption
function submitVote(
    uint256 optionIndex,
    externalEuint32 encryptedVote,
    bytes calldata inputProof
) external {
    // Convert external encrypted input to internal format
    euint32 voteValue = FHE.fromExternal(encryptedVote, inputProof);
    
    // Homomorphic addition: add encrypted vote to encrypted total
    option.encryptedTotal = FHE.add(option.encryptedTotal, voteValue);
    
    // Grant decryption permission to contract and owner
    FHE.allowThis(option.encryptedTotal);
    FHE.allow(option.encryptedTotal, owner);
}
```

### Encryption & Decryption Process

**Client-Side Encryption (Frontend):**

```typescript
// 1. Initialize FHEVM instance with provider
const fhevmInstance = await createFhevmInstance({
  provider: eip1193Provider,
  chainId,
  storage
});

// 2. Encrypt vote value (e.g., 1 for single vote)
const encryptedInput = await fhevmInstance.encrypt32(voteValue);

// 3. Submit to contract with proof
await contract.submitVote(
  optionIndex,
  encryptedInput.data,
  encryptedInput.signature
);
```

**Server-Side Decryption (Authorized Addresses):**

```typescript
// 1. Fetch encrypted total from contract
const encryptedTotal = await contract.getEncryptedTotal(optionIndex);

// 2. Request decryption (requires permission)
const decryptedValue = await fhevmInstance.decrypt(
  contractAddress,
  encryptedTotal
);

// 3. Display result
console.log(`Total votes: ${decryptedValue}`);
```

## 🛠️ Technical Stack

- **Smart Contracts**: Solidity ^0.8.24
- **Encryption**: FHEVM by Zama (Fully Homomorphic Encryption)
- **Frontend**: Next.js 15, React 19, TypeScript
- **Wallet Integration**: RainbowKit, Wagmi, Viem
- **Styling**: Tailwind CSS
- **Testing**: Hardhat, Vitest
- **Deployment**: Sepolia Testnet

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
encrypted-survey/
├── contracts/                 # Smart contract source files
│   └── EncryptedSurvey.sol   # Privacy-preserving survey contract
├── deploy/                    # Deployment scripts
├── tasks/                     # Hardhat custom tasks
├── test/                      # Test files
├── frontend/                  # Next.js frontend application
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   └── fhevm/                # FHEVM SDK integration
├── hardhat.config.ts          # Hardhat configuration
└── package.json               # Dependencies and scripts
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 🎯 Using the Deployed Application

### Quick Start Guide

1. **Visit the Application**
   - Navigate to [https://pro2-umber.vercel.app/](https://pro2-umber.vercel.app/)

2. **Connect Your Wallet**
   - Click the "Connect Wallet" button in the header
   - Select your preferred wallet provider (MetaMask recommended)
   - Approve the connection request

3. **For Survey Owners**
   - Configure a new survey with your question and options
   - Submit the configuration transaction
   - Share the survey with participants
   - Grant decryption permissions when ready to reveal results

4. **For Voters**
   - View the active survey question and options
   - Select your preferred option
   - Optionally set a vote weight (default: 1)
   - Submit your encrypted vote
   - Your vote remains private and cannot be changed once submitted

5. **View Results** (Authorized Users Only)
   - If you have decryption permission, click "Decrypt" on each option
   - View the aggregated vote totals
   - Individual votes remain encrypted and private

### Network Configuration

The application automatically detects your network:
- **Localhost (Chain ID: 31337)**: For local development with Hardhat
- **Sepolia Testnet (Chain ID: 11155111)**: For testing on Ethereum testnet
- Ensure you have the contract deployed on your selected network

### Troubleshooting

- **"Contract Not Deployed" Error**: The contract needs to be deployed on your current network
- **FHEVM Status**: Wait for FHEVM to initialize (status should change from "idle" to "ready")
- **Transaction Failures**: Ensure you have sufficient gas and the correct network is selected

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Repository**: [https://github.com/Lynn6382/priva-vote-glow](https://github.com/Lynn6382/priva-vote-glow)
- **Live Demo**: [https://pro2-umber.vercel.app/](https://pro2-umber.vercel.app/)
- **FHEVM Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Zama Community**: [Zama Discord](https://discord.gg/zama)

## 🔗 Links

- **Deployed Application**: [https://pro2-umber.vercel.app/](https://pro2-umber.vercel.app/)
- **Source Code**: [https://github.com/Lynn6382/priva-vote-glow](https://github.com/Lynn6382/priva-vote-glow)
- **Demo Video**: [Watch the demo](./vote.mp4)
- **FHEVM by Zama**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)

---

**Built with ❤️ using FHEVM by Zama**
