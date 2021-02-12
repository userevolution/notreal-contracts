const TokenMarketplaceV2 = artifacts.require('TokenMarketplaceV2');
const ArtistAcceptingBidsV2 = artifacts.require('ArtistAcceptingBidsV2');
const SelfServiceFrequencyControls = artifacts.require('SelfServiceFrequencyControls');
const SelfServiceEditionCurationV4 = artifacts.require('SelfServiceEditionCurationV4');
const NotRealDigitalAssetV2 = artifacts.require('NotRealDigitalAssetV2');

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
  const _0_POINT_0_0_1_ETH = '1000000000000000';
  const _0_POINT_2_PERCENT = '2';
  const _0_POINT_3_PERCENT = '3';
  const _0_POINT = '0'

  const tokenMarketplaceV2 = await TokenMarketplaceV2.deployed();
  await tokenMarketplaceV2.setMinBidAmount(_0_POINT_0_0_1_ETH, {from: _nrAccount});
  console.log(`TokenMarketplace V2 [${tokenMarketplaceV2.address}] updated to [${(await tokenMarketplaceV2.minBidAmount()).toString()}]`);

  await tokenMarketplaceV2.setArtistRoyaltyPercentage(_0_POINT_2_PERCENT, {from: _nrAccount});
  console.log(`TokenMarketplace V2 [${tokenMarketplaceV2.address}] royalties set to [${(await tokenMarketplaceV2.artistRoyaltyPercentage()).toString()}]`);

  await tokenMarketplaceV2.setPlatformPercentage(_0_POINT_3_PERCENT, {from: _nrAccount});
  console.log(`TokenMarketplace V2 [${tokenMarketplaceV2.address}] platform royalties set to [${(await tokenMarketplaceV2.platformFeePercentage()).toString()}]`);

  const artistAcceptingBidsV2 = await ArtistAcceptingBidsV2.deployed();
  await artistAcceptingBidsV2.setMinBidAmount(_0_POINT_0_0_1_ETH, {from: _nrAccount});
  console.log(`Auction V1 [${artistAcceptingBidsV2.address}] updated to [${(await artistAcceptingBidsV2.minBidAmount()).toString()}]`);

  const selfServiceV4 = await SelfServiceEditionCurationV4.deployed();
  await selfServiceV4.setMinPricePerEdition(_0_POINT_0_0_1_ETH, {from: _nrAccount});
  console.log(`Self Service V4 [${selfServiceV4.address}] updated to [${(await selfServiceV4.minPricePerEdition()).toString()}]`);

  const selfServiceFrequencyControls = await SelfServiceFrequencyControls.deployed();
  selfServiceFrequencyControls.setFrequencyOverride(_nrAccount, true, {from: _nrAccount});
  console.log(`Set frequency override for ${_nrAccount}`)

  const notRealDigitalAssetV2 = await NotRealDigitalAssetV2.deployed();
  notRealDigitalAssetV2.setApprovalForAll(tokenMarketplaceV2.address, true, {from: _nrAccount});
  console.log(`Approve token marketplace ${tokenMarketplaceV2.address} as operator for NRDA ${notRealDigitalAssetV2.address}`)
  
};
