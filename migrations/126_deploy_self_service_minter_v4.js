const NotRealDigitalAssetV2 = artifacts.require('NotRealDigitalAssetV2');
const ArtistAcceptingBidsV2 = artifacts.require('ArtistAcceptingBidsV2');

const SelfServiceEditionCurationV4 = artifacts.require('SelfServiceEditionCurationV4');

const SelfServiceAccessControls = artifacts.require('SelfServiceAccessControls');
const SelfServiceFrequencyControls = artifacts.require('SelfServiceFrequencyControls');

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
    _nrAccount = new HDWalletProvider(require('../mnemonic_live'), `https://mainnet.infura.io/v3/${infuraApikey}`, 0).getAddress();
  }

  console.log(`_nrAccount = ${_nrAccount}`);
  const nrda = await NotRealDigitalAssetV2.deployed();
  const auction = await ArtistAcceptingBidsV2.deployed();
  const accessControls = await SelfServiceAccessControls.deployed();

  // Get deployed contracts
  console.log(`NRDA V2 [${nrda.address}] Auction V2 [${auction.address}] AccessControls V1 [${accessControls.address}]`);

  // Deploy new frequency controls
  await deployer.deploy(SelfServiceFrequencyControls, {from: _nrAccount});

  const frequencyControls = await SelfServiceFrequencyControls.deployed();
  console.log(`Frequency controls deployed [${frequencyControls.address}]`);

  // Deploy the self service contract
  await deployer.deploy(SelfServiceEditionCurationV4,
    nrda.address,
    auction.address,
    accessControls.address,
    frequencyControls.address,
    {from: _nrAccount}
  );

  const selfServiceV4 = await SelfServiceEditionCurationV4.deployed();
  console.log('Self service address', selfServiceV4.address);

  // whitelist self service so it can mint new editions
  const ROLE_NOT_REAL = web3.utils.keccak256('ROLE_NOT_REAL');
  await nrda.addAddressToAccessControl(selfServiceV4.address, ROLE_NOT_REAL, {from: _nrAccount});

  // whitelist self service address so it can enable auctions
  await auction.addAddressToWhitelist(selfServiceV4.address, {from: _nrAccount});

  // whitelist self service address so it can call frequency controls
  await frequencyControls.addAddressToWhitelist(selfServiceV4.address, {from: _nrAccount});

};
