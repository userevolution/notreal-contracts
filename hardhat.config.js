/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");
require("hardhat-watcher");
require('dotenv').config()

const mnemonic = process.env.NOT_REAL_MNEMONIC;

module.exports = {
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      }
    }
  },
  mocha: {
    parallel: true
  },
  networks: {
    local: {
      url: "http://127.0.0.1:7545",
      mnemonic: mnemonic,
      allowUnlimitedContractSize: true,
      blockGasLimit: 9999999999999,
    },
    hardhat: {
      allowUnlimitedContractSize: true,
      blockGasLimit: 9999999999999,
      chainId: 5777,
      accounts: {
        mnemonic: mnemonic
      }
    }
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts/**/*'],
    },
    test: {
      tasks: [{ command:'test', params: {testFiles: ['{path}']} }],
      files: ['./test/**/*'],
      verbose: true
    },
    size: {
      tasks: ['compile', 'size-contracts'],
      files: ['./contracts/**/*'],
    }
  }
};
