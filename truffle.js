const HDWalletProvider = require('truffle-hdwallet-provider');
require('dotenv').config()
const infuraApikey = 'fb81a1a1f7bb471bb61f80207f2fee26';
const mnemonic = process.env.NOT_REAL_MNEMONIC;
if (!mnemonic) {
  throw new Error(`
    You are missing a environment variable called NOT_REAL_MNEMONIC - please set one
    e.g. export NOT_REAL_MNEMONIC='<your seed phrase>'
  `);
}

/**
 * Loads mocha settings based on which shell env variables are set. Options are:
 *   - GAS_REPORTER: run gas analytics with tests
 */
const mocha = require('./mocha-config');

module.exports = {
  // N.B - this seems to crash solidity-coverage so dont run at the same time
  mocha,
  compilers: {
    solc: {
      version: '0.6.12',
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  },
  plugins: [
    'truffle-plugin-verify',
    'truffle-contract-size'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_KEY
  },
  verify: {
    preamble: 'Author: NotReal.ai\n'
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*', // Match any network id
      gas: 6721975,
      gasPrice: 0x01
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 6721975,
      gasPrice: 1
    },
    testrpc: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 6721975,
      gasPrice: 0x01
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
    live: {
      provider: function () {
        return new HDWalletProvider(require('./mnemonic_live'), `https://mainnet.infura.io/v3/${infuraApikey}`);
      },
      network_id: 1,
      gas: 6075039,         // default = 4712388
      gasPrice: 55000000000, // default = 100 gwei = 100000000000
      timeoutBlocks: 200,   // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true      // Skip dry run before migrations? (default: false for public nets )
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraApikey}`);
      },
      network_id: 3,
      gas: 7000000, // default = 4712388
      gasPrice: 5000000000 // default = 100 gwei = 100000000000
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraApikey}`);
      },
      network_id: 4,
      gas: 6500000, // default = 4712388
      gasPrice: 8000000000 // default = 100 gwei = 100000000000
    },
    matic: {
      provider: () => new HDWalletProvider(mnemonic, `https://rpc-mumbai.maticvigil.com/v1/c15ba8188850d88fcd6b7accda706671878af26d
`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
};
