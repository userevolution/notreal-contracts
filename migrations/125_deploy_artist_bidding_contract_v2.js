const NotRealDigitalAssetV2 = artifacts.require('NotRealDigitalAssetV2');
const ArtistAcceptingBidsV2 = artifacts.require('ArtistAcceptingBidsV2');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'fb81a1a1f7bb471bb61f80207f2fee26';
const mnemonic = process.env.NOT_REAL_MNEMONIC;

module.exports = async function (deployer, network, accounts) {

  let _nrAccount = accounts[0];
  console.log(`Running within network = ${network}`);

  if (network === 'matic') {
    _nrAccount = new HDWalletProvider(mnemonic, `https://rpc-mumbai.matic.today`, 0).getAddress();
  }

  // Load in other accounts for different networks
  if (network === 'ropsten' || network === 'ropsten-fork' || network === 'rinkeby' || network === 'rinkeby-fork') {
    _nrAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/v3/${infuraApikey}`, 0).getAddress();
  }

  if (network === 'live' || network === 'live-fork') {
    _nrAccount = new HDWalletProvider(require('../../not-real-web3-marketplace/mnemonic_live'), `https://mainnet.infura.io/v3/${infuraApikey}`, 0).getAddress();
  }

  console.log(`_nrAccount = ${_nrAccount}`);

  const nrda = await NotRealDigitalAssetV2.deployed();

  await deployer.deploy(ArtistAcceptingBidsV2, nrda.address, {from: _nrAccount});

  const ROLE_MINTER = web3.utils.keccak256('ROLE_MINTER');

  const auction = await ArtistAcceptingBidsV2.deployed();
  console.log("Auction address", auction.address);

  await nrda.addAddressToAccessControl(auction.address, ROLE_MINTER, {from: _nrAccount});
};
