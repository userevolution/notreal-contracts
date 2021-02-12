const _ = require('lodash');
const Promise = require('bluebird');
const program = require('commander');
const fs = require('fs');
const Web3 = require('web3');
//const {INFURA_API_KEY_V3} = require('../../../functions/const');

const all = require('it-all')
const mime = require('mime-types')

const IpfsHttpClient = require('ipfs-http-client')
const { globSource } = IpfsHttpClient
const ipfs = IpfsHttpClient({
    url: 'https://ipfs.infura.io:5001'
})

    ////////////////////////////////
    // The network to run against //
    ////////////////////////////////

if (require.main === module) {
    program
        .requiredOption('-c, --category <category>', 'The upload category and name of subdirectory images')
        .option('-f, --frame-side <n>', 'number of image frames per side in grid animation', parseInt, 27)
        .option('-g, --grid-side <n>',  'number of tokens per side in grid animation', parseInt, 5)
        .parse(process.argv);


    void async function () {
        const upload = Uploader(program)
        console.log('uploading files', upload.uploadFiles())
        const results = await upload.uploadIpfs(upload.uploadFiles().slice(0,1))
        console.log(results)
    }()
} 

    const sleep = (ms, log=true) => {
        if (log) { console.log('sleeping ', ms) }
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const Uploader = ({category, frameSide, gridSide, input}) => ({
        delay: 2500,

        mapFrameToGrid () {
            const start  = parseInt(gridSide / 2)
            const step   = parseInt(frameSide / gridSide)
            const end    = frameSide
            const centers = _.range(start, end, step)
            let coords = [];
            centers.forEach(y => {
                centers.forEach(x => {
                    coords.push([x,y])
                })
            })

            return coords
        },

        mapCoordToFile (c) {
            const [x, y] = c;
            const idx = _.padStart((x + y*frameSide), 5, 0)
            const filename = `${idx}-${x}-${y}.png`
            return filename
        },

        filepath (filename) { return `./${category}/${filename}` },

        uploadBuffers () { return this.uploadFiles().map(f => fs.readFileSync(f)) },
        uploadFiles() { return this.mapFrameToGrid().map(c => `${input}/${this.mapCoordToFile(c)}`) },

        async uploadIpfs(files) {
            //const lastUpload = JSON.parse(fs.readFileSync(`./data/last-upload.json`))
            const lastUpload = null
            const ipfsCache = JSON.parse(fs.readFileSync(`./data/ipfs-cache.json`))
            //const skip = [1371,1374, 1376, 1378]
            const skip = []

            const results = []
            for (var i=0; i<files.length; i++) {
                const file = files[i]

                const ipfsHash = ipfsCache[file]
                const doSkip = skip.map(s => file.includes(s)).reduce((a,b) => a || b, false)
                if (ipfsHash && !doSkip) {
                    results.push({path: file, cid: ipfsHash})
                    continue
                }

                const filePath = file.split('/').slice(-1)[0]
                console.log(filePath)
                /*
                const filePath = file.split('/').slice(-1)[0]
                console.log(filePath)

                if (lastUpload) {
                    const uploadedFile = _.find(lastUpload.upload, {path: filePath})
                    if (uploadedFile) {
                        //console.log('cached', uploadedFile)
                        results.push(uploadedFile)
                        continue
                    }
                }
                */

                const loadedImage = fs.createReadStream(file);
                const uploads = [{path: filePath, content: loadedImage}]
                let r;
                // TODO: Fix stupid nested retries
                try {
                    r = await all(ipfs.add(uploads, {pin: true}))
                } catch(err) {
                    console.log(err)
                    await sleep(this.delay*5)
                    try {
                        r = await all(ipfs.add(uploads, {pin: true}))
                    } catch(err) {
                        console.log(err)
                        await sleep(this.delay*5)
                        try {
                            r = await all(ipfs.add(uploads, {pin: true}))
                        } catch(err) {
                            r = await all(ipfs.add(uploads, {pin: true}))
                        }
                    }
                }
                        
                results.push(r[0])
                //console.log(r[0], 'uploaded')
                await sleep(this.delay)
            }
            return results
        },
        async upload(num=undefined) {
            const files = this.uploadFiles().slice(0,num)
            console.log(files)
            //console.log('uploading files', files)
            let results = await this.uploadIpfs(files)
            results = _.map(results, (r) => ({...r, cid: r.cid.toString()}))
            console.log('results', results)
            
            const uploadCache = _.fromPairs(results.map(r => [`${input}/${r.path}`, r.cid]))
            const ipfsCache = JSON.parse(fs.readFileSync(`./data/ipfs-cache.json`))
            fs.writeFileSync('./data/ipfs-cache.json', JSON.stringify(_.merge(uploadCache, ipfsCache)))
            //fs.writeFileSync('./data/last-upload.json', JSON.stringify({upload: results}))
            return results
        },
        async uploadMetadata(metadata) {
          const metabuf = Buffer.from(JSON.stringify(metadata));
          const response = await all(ipfs.add(metabuf, {pin: true}))
          return response[0].cid.toString()
        },

    })

    const Edition = ({
        category, 
        totalAvailable, 
        priceInEther, 
        enableAuctions, 
        auctionStart,
        auctionOffset,
        auctionLength,
        fileMimeType
    }) => ({
        generate(idx, pseudoEdition, prefix='') {
            const startDate     = auctionStart + auctionOffset*idx
            const endDate       = startDate + auctionLength
            //const pseudoEdition = idx + 1
            return {
              name: `${category} ${prefix}#${pseudoEdition}`,
              description: `${category} ${prefix}#${pseudoEdition}`,
              pseudoEdition,
              priceInEther,
              totalAvailable,
              enableAuctions,
              tags: [category],
              startDate,
              endDate,
              fileMimeType
            }
        }
    })


    const Metadata = () => ({
        generate({imageUpload, edition, artistName}) {
            let meta = {
              'name': _.trim(edition.name),
              'description': _.trim(edition.description),
              'pseudoEdition': edition.pseudoEdition,
              'attributes': {
                'artist': artistName,
                'scarcity': this.scarcity(edition),
                'tags': edition.tags
              },
              'external_uri': 'https://notreal.ai',
              'image': imageUpload.ipfsImage ? imageUpload.ipfsImage : ''
            };
            if (imageUpload.ipfsImage) {
              const isWebM = edition.fileMimeType === 'video/webm';
              if (isWebM) {
                meta['animation_url'] = imageUpload.ipfsImage;
              }
              // metadata['attributes']['file_size_bytes'] = this.edition.fileSizeInBytes;
              meta['attributes']['asset_type'] = edition.fileMimeType;
            }
            return meta;
        },
        scarcity(edition) {
            const total = parseInt(edition.totalAvailable);
            if (total === 1) {
              return 'ultrarare';
            } else if (total <= 10) {
              return 'rare';
            } else {
              return 'common';
            }
        }
    })


module.exports = {Uploader, Metadata, Edition}



    //const results = await uploader.processIpfsImages(uploader.uploadFiles().slice(0,1))
    //console.log(results)
    //uploader.uploadFile(uploader.uploadFiles()[0])
    //console.log(uploader.uploadBuffers()[0])



    //console.log(all(globSource(uploadFiles)))

    /*
    uploadFiles.slice(0,2)
    for await (const file of ipfs.add(globSource(uploadFiles.slice(0,2)))) {
        console.log(file)
    }
    */



    /*
    process.exit()

    const network = contracts.getNetwork(program.network);

    ////////////////////////////////
    // The network to run against //
    ////////////////////////////////

    const httpProviderUrl = getHttpProviderUri(network);
    console.log("httpProviderUrl", httpProviderUrl);

    const wallet = new HDWalletProvider(program.seed, httpProviderUrl, 0);
    const fromAccount = wallet.getAddress();
    console.log("fromAccount", fromAccount);
    console.log("wallet.wallets[fromAccount]", wallet.wallets[fromAccount].getPrivateKeyString());

    const provider = getSignerProvider(network, fromAccount, wallet.wallets[fromAccount].getPrivateKeyString());

    const ssContract = connectToSelfServiceContract(network, provider);
    console.log(ssContract)

    let startingNonce = await getAccountNonce(network, fromAccount);

    const file = JSON.parse(fs.readFileSync(`./scripts/utils/mint/data/mint-batch.json`)).batch;
    // console.log(file);
    //
    const createEdition = (contract, data, opts) => {

        let {totalAvailable, tokenUri, priceInWei, enableAuctions, artist, optionalSplitAddress, startDate, endDate} = data;
        console.log('artist', artist)
        console.log('fromAccount', fromAccount)

        const isCallingArtists = fromAccount.toLowerCase() === artist.toLowerCase();
        console.log(`Is calling artist [${isCallingArtists}]`);

        let artistCommission = 85;
        let optionalSplitRate = 0;

        if (optionalSplitAddress) {
          optionalSplitRate = 42;
          artistCommission = 43;
        } else {
          optionalSplitAddress = '0x0000000000000000000000000000000000000000';
        }

        if (!startDate) { startDate = 0 }
        if (!endDate)   { endDate = 0 }
        const editionType = 1;

        // If the caller isn't the artist assume its KO making it for them
        return isCallingArtists
          ? contract.createEdition(enableAuctions, optionalSplitAddress, optionalSplitRate, totalAvailable, priceInWei, startDate, endDate, artistCommission, editionType, tokenUri, opts)
          : contract.createEditionFor(artist, enableAuctions, optionalSplitAddress, optionalSplitRate, totalAvailable, priceInWei, startDate, endDate, artistCommission, editionType, tokenUri, opts);
      };

    const promises = _.map(file, (edition) => {
        console.log(edition);

        const result = createEdition(ssContract, edition, {
            from: fromAccount,
            nonce: startingNonce,
            gas: gas,
            gasPrice: gasPrice
        })

        console.log(result)

        startingNonce++;
        return result;
    });

    Promise.all(promises)
        .then((rawTransactions) => {
            console.log(`
              Transactions Submitted
                    - Total [${rawTransactions.length}]
            `);
            console.log(rawTransactions);
            process.exit();
        });
    */
