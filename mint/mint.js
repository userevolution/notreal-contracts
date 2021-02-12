const _ = require('lodash');
const program = require('commander');
const fs = require('fs');
const Web3 = require('web3');
const {INFURA_API_KEY_V3} = require('../../../functions/const');

const {contracts, abi} = require('nrda-contract-tools');

const {rpcHttpEndpoint} = contracts;

const HDWalletProvider = require('truffle-hdwallet-provider');

const Eth = require('ethjs');
const sign = require('ethjs-signer').sign;
const SignerProvider = require('ethjs-provider-signer');

const { ethers } = require('ethers');
const { NonceManager } = require('@ethersproject/experimental')

const {gas, gasPrice} = {gas: 4075039, gasPrice: 5000000000};
console.log(`gas=${gas} | gasPrice=${gasPrice}`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//function rpcHttpEndpoint(network) {
//    if (network === 'local') {
//        return 'HTTP://127.0.0.1:7545';
//    }
//    if (network === 'matic') {
//        return 'https://rpc-mumbai.maticvigil.com/v1/c15ba8188850d88fcd6b7accda706671878af26d'
//    }
//    if (network === 'maticlive') {
//        return 'https://rpc-mainnet.maticvigil.com/v1/c15ba8188850d88fcd6b7accda706671878af26d'
//    }
//    return `https://${network}.infura.io/v3/${INFURA_API_KEY_V3}`;
//}

function getSignerProvider(network, fromAccount, privateKey) {
    const endpoint = rpcHttpEndpoint(network);
    const provider = new ethers.providers.JsonRpcProvider(endpoint);
    let wallet = new ethers.Wallet(privateKey, provider);
    //wallet = wallet.connect(provider);
    //wallet = new NonceManager(wallet);
    return new NonceManager(wallet);
    //const signer = provider.getSigner();

    //if (network === 'local') {
    //    return new SignerProvider(`HTTP://127.0.0.1:7545`, {
    //        signTransaction: (rawTx, cb) => cb(null, sign(rawTx, privateKey)),
    //        accounts: (cb) => cb(null, [fromAccount]),
    //    });
    //}

    //const endpoint = rpcHttpEndpoint(network);
    //console.log('endpoint:', endpoint);
    //return new SignerProvider(endpoint, {
    //    signTransaction: (rawTx, cb) => cb(null, sign(rawTx, privateKey)),
    //    accounts: (cb) => cb(null, [fromAccount]),
    //});
}

function connectToSelfServiceContract(network, provider) {
    return new ethers.Contract(
      contracts.getSelfServiceMinterV4Address(network),
      abi.selfServiceMinterV4,
      provider
    )
    //return new Eth(provider)
    //    .contract(abi.selfServiceMinterV4)
    //    .at(contracts.getSelfServiceMinterV4Address(network));
}


function connectToNrdaV2Contract(network, provider) {
    return new ethers.Contract(
      contracts.getKodaV2Address(network),
      abi.kodaV2,
      provider
    )
    // Need to rename Nrda -> Koda inside of nrda-contract-tools...
    //return new Eth(provider)
    //    .contract(abi.kodaV2)
    //    .at(contracts.getKodaV2Address(network));
}

async function getAccountNonce(network, account) {
    //return new Eth(new Eth.HttpProvider(rpcHttpEndpoint(network)))
    //    .getTransactionCount(account);
}

const Mint = function ({networkId, seed}) {
    const network = contracts.getNetwork(networkId);

    const httpProviderUrl = rpcHttpEndpoint(network);
    console.log("httpProviderUrl", httpProviderUrl);

    const wallet = new HDWalletProvider(seed, httpProviderUrl, 0);
    const fromAccount = wallet.getAddress();
    console.log("fromAccount", fromAccount);
    //console.log("wallet.wallets[fromAccount]", wallet.wallets[fromAccount].getPrivateKeyString());

    const provider = getSignerProvider(network, fromAccount, wallet.wallets[fromAccount].getPrivateKeyString());

    const ssContract = connectToSelfServiceContract(network, provider);
    const nrContract = connectToNrdaV2Contract(network, provider);
    console.log('SelfServiceContract', ssContract.address);
    console.log('NRDAContract', nrContract.address);


    // console.log(file);
    //
    const createEdition = async (contract, data, opts) => {

        console.log(data);
        let {totalAvailable, tokenUri, priceInWei, enableAuctions, artist, optionalSplitAddress, startDate, endDate} = data;
        //console.log('fromAccount', fromAccount)

        const isCallingArtists = fromAccount.toLowerCase() === artist.toLowerCase();
        //console.log(`Is calling artist [${isCallingArtists}]`);

        let artistCommission = 0;
        let optionalSplitRate = 0;

        if (optionalSplitAddress) {
          //optionalSplitRate = 42;
          //artistCommission = 43;
        } else {
          optionalSplitAddress = '0x0000000000000000000000000000000000000000';
        }

        if (!startDate) { startDate = 0 }
        if (!endDate)   { endDate = 0 }
        const editionType = 1;
      
        //console.log(network)
        //console.log(contract.address);
        //console.log(isCallingArtists);
        //console.log(enableAuctions, optionalSplitAddress, optionalSplitRate, totalAvailable, priceInWei, startDate, endDate, artistCommission, editionType, tokenUri, opts);

        const create = (isCallingArtists
          ? contract.createEdition(enableAuctions, optionalSplitAddress, optionalSplitRate, totalAvailable, priceInWei, startDate, endDate, artistCommission, editionType, tokenUri, opts)
          : contract.createEditionFor(artist, enableAuctions, optionalSplitAddress, optionalSplitRate, totalAvailable, priceInWei, startDate, endDate, artistCommission, editionType, tokenUri, opts));

        //const result = await (await create).wait();
        const result = await create;
        console.log('createEdition result', result)

        //console.log('result', result.value.toString())

        return result;
    };

    //const mintToken = (contract, data, opts) => {
    //    let {to, editionNumber} = data;
    //    return contract.mintToken(to, editionNumber, opts);
    //}

    const contractOpts = async () => {
        let startingNonce = await provider.getTransactionCount('pending');
        //console.log('startingNonce', startingNonce);
        //let startingNonce = parseInt(await getAccountNonce(network, fromAccount));
        return {
            from: fromAccount,
            //nonce: 0,
            nonce: startingNonce,
            gasLimit: gas,
            //gasPrice: gasPrice
        }
    }

    return {
        account() {
            return fromAccount;
        },
        token({tokenUri, artist, edition}) {
            return {
                artist,
                tokenUri,
                totalAvailable: edition.totalAvailable,
                priceInWei: Web3.utils.toWei(edition.priceInEther.toString(), 'ether'),
                enableAuctions: edition.enableAuctions,
                optionalSplitAddress: edition.optionalSplitAddress,
                startDate: edition.startDate,
                endDate: edition.endDate
            }
        },
        async createEditions(editions, nonce) {
            const opts = await contractOpts()
            if(nonce) { opts.nonce = nonce}
            //console.log('nonce', opts.nonce)
            //console.log(network, fromAccount)
            //debugger
            //let startingNonce = await getAccountNonce(network, fromAccount);

            const txs = []
            for (var i=0; i<editions.length; i++) {
                const token = editions[i]
                //console.log('minting edition', token)
                const result = await createEdition(ssContract, token, opts)
                await sleep(100)
                opts.nonce += 1;
                txs.push(result)
                //console.log('tx', result)
            }

            console.log(`finished createEditions with ${txs.length} transactions`)
            return [txs, opts.nonce]
        },
        async mintEditionsForArtist(artist, nonce) {
            console.log('Startin mintEditionsForArtist:', artist);
            const opts = await contractOpts()
            if(nonce) { opts.nonce = nonce}
            //console.log('nonce', opts.nonce)

            console.log('nrContract', nrContract.address);
            console.log('here1')
            let editions = await nrContract.artistsEditions(artist, opts);
            //console.log('editions', editions)
            //editions = await editions.wait()
            console.log('artistsEditions:', editions);
            //const editions = (await (await nrContract.artistsEditions(artist)).wait())[0]

            const txs = []
            for (var i=0; i<editions.length; i++) {
                let mint = await nrContract.mint(artist, editions[i], opts);
                //mint = await mint.wait();
                console.log('mint:', mint)
                //const result = (await ().wait())
                await sleep(100)
                opts.nonce += 1
                //txs.push(result)
                //console.log('tx', result)
            }

            let tokensOf = await nrContract.tokensOf(artist, opts);
            //tokensOf = await tokensOf.wait();

            console.log('tokensOf:', tokensOf);

            //const tokens = (await (await nrContract.tokensOf(artist)).wait())[0]

            console.log('These should now match')
            console.log('Artist tokens length: ', tokensOf.length)
            console.log('Artist editions length: ', editions.length)

            return [tokensOf, opts.nonce]
        },
        //async mintTokens(tokens) {
        //    console.log(network, fromAccount)
        //    //debugger
        //    //let startingNonce = await getAccountNonce(network, fromAccount);
        //    const opts = await contractOpts();

        //    const txs = []
        //    for (var i=0; i<tokens.length; i++) {
        //        const token = tokens[i]
        //        console.log('minting token', token)
        //        const result = await mintToken(nrContract, token, opts)
        //        opts.nonce +=1;
        //        //startingNonce++;
        //        txs.push(result)
        //        console.log('tx', result)
        //    }

        //    console.log(`submitted ${txs.length} transactions`)
        //    return txs
        //}
    }
}


if (require.main === module) {
    program
        .option('-a, --artist <artist>', 'mint editions for artist')
        .option('-f, --file <file>', 'json file of tokens in data subdir')
        .option('-n, --network-id <n>', 'Network - either 1,3,4,5777', parseInt)
        .option('-s, --seed <n>', 'The network seed')
        .parse(process.argv);

    ////////////////////////////////
    // The network to run against //
    ////////////////////////////////
    if (!program.networkId) {
        console.log(`Please specify --network-id=1, 3, 4 or 5777`);
        process.exit();
    }

    if (!program.seed) {
        console.log(`Please specify --seed "my seed ... ... ..."`);
        process.exit();
    }

    void async function () {
        if (program.artist) {
            await Mint(program).mintEditionsForArtist(program.artist)
        } else {
            const tokens = JSON.parse(fs.readFileSync(`./scripts/utils/mint/data/${f}.json`)).batch;
            await Mint(program).createTokens(tokens)
        }
    }()
}

module.exports = { Mint }
