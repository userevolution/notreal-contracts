const _ = require('lodash');
const program = require('commander');
const fs = require('fs');
const { Uploader, Edition, Metadata }= require('./grid.js')
const { Mint }= require('./mint.js')
const { DateTime } = require('luxon')
const readline = require('readline');
const ohash = require('object-hash')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example cmd:
// node main.js -c config -n 5777 --seed "MNEMONIC PHRASE HERE"
program
    .option('-n, --network-id <network-id>', 'network id (1,3,4,5777)')
    .option('-i, --input <input>', 'input')
    .option('-r, --range <range>', 'range')
    .option('-s, --seed <seed>', 'seed')
    .option('-c, --config <config>', 'JSON config file')
    .option('-d, --dir <dir>', 'Directory of images')
    .option('-y, --yes', 'Auto confirm')
    .option('--resume <resume>', 'resume')
    .parse(process.argv)

const chain = Mint(program)
const { config } = program


// Parse time setting like {"minus": {"hours": 25}}
// And pass to luxon
const parseConfigTime = (setting, ts=null) => {
    // If already a unix timestamp don't do anything
    if (setting == parseInt(setting)) { return setting }
    ts = ts || DateTime.local()
    const cmd = Object.keys(setting)[0]
    const arg = Object.values(setting)[0]
    return parseInt(ts[cmd](arg).toSeconds())
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

const main = async (input) => {
    const cfg = JSON.parse(fs.readFileSync(`./data/${config}.json`))

    // If we want to restart the tokenization from a fixed point in time,
    // in order to spare reuploading every single token to IPFS
    /*
    const firstEdition = JSON.parse(fs.readFileSync(`./data/first-edition.json`))
    if (firstEdition.startDate) {
        cfg.auctionStart = firstEdition.startDate
        cfg.editionStart = 0
    } else 
    */
    let lastEdition;
    lastEdition = JSON.parse(fs.readFileSync(`./data/last-edition.json`))
    //if(program.resume) {
    //  lastEdition = JSON.parse(fs.readFileSync(`./data/last-edition.json`))
    //} else {
    //  lastEdition = {}
    //}

    if (lastEdition.startDate) {
        // Pick up where we left off
        cfg.auctionStart = lastEdition.startDate + cfg.auctionOffset
        cfg.editionStart = lastEdition.pseudoEdition + 1
    } else {
        cfg.auctionStart = parseConfigTime(cfg.auctionStart)
        cfg.editionStart = 0
    }

    cfg.input = input
    // IPFS uploader
    const up   = Uploader(cfg)
    // edition generator
    const egen = Edition(cfg)
    // metadata generator
    const mgen = Metadata(cfg)
    // Get current artist
    const artist = cfg.artist || chain.account()

    const tokens = []

    // Upload files to IPFS
    const ipfsFiles = await up.upload()
    const ipfsUrls = ipfsFiles.map(f => `https://ipfs.infura.io/ipfs/${f.cid}`)

    const tokenCache = JSON.parse(fs.readFileSync(`./data/token-cache.json`))

    let edition
    for (var i=0; i < ipfsUrls.length; i++) {
        // Generate edition
        edition = egen.generate(i, i + cfg.editionStart)


        // Um this doesn't actually work, first edition gets overwritten every batch
        //if (i == 0) {
        //    fs.writeFileSync('./data/first-edition.json', JSON.stringify(edition))
        //}
        // Generate metadata
        const meta = mgen.generate({
            edition,
            imageUpload: { ipfsImage: ipfsUrls[i] },
            artistName: 'NotReal'
        })

        const tokenHash = ohash(meta)
        let tokenUri = tokenCache[tokenHash]
        if (!tokenUri) {
            // Upload tokens metadata to IPFS
            tokenUri = await up.uploadMetadata(meta)
        }

        tokenCache[tokenHash] = tokenUri

        const token = chain.token({tokenUri, artist, edition})

        // Generate token data that will get committed to chain
        console.log('idx', i)
        console.log('edition', edition)
        console.log('meta', meta)
        console.log('token', {
            ...token, 
            startDate: DateTime.fromSeconds(token.startDate).toISO(),
            endDate: DateTime.fromSeconds(token.endDate).toISO(),
        })
        tokens.push(token)
    }

    console.log(tokens[0].startDate - lastEdition.startDate)


    fs.writeFileSync('./data/last-edition.json', JSON.stringify(edition))
    fs.writeFileSync('./data/token-cache.json', JSON.stringify(tokenCache))

    console.log(tokens)

    // Temp remove confirmation
    if (!program.yes) {
        const ans = await askQuestion('The above tokens will be committed to chain. Type "y" to confirm.')
        if (ans != 'y') { process.exit() }
    }

    const editions = tokens;

    //let nonce = JSON.parse(fs.readFileSync('./data/last-nonce.json')).nonce || 0
    
    // Commit all the tokens to blockchain
    let nonce;
    let results;
    results = await chain.createEditions(editions)
    nonce = results[1]
    console.log('Created editions', results[0])
    await sleep(5000);

    results = await chain.mintEditionsForArtist(artist, nonce)
    nonce = results[1]
    console.log('Minted tokens', results[0])

    //fs.writeFileSync('./data/last-nonce.json', JSON.stringify({nonce}))
    await sleep(5000);

    process.exit()
}

void async function () {
    main(program.input)
    /*
    if (program.range) {
        const pad = 5
        const range = _.range(...program.range.split('..').map(n => parseInt(n))).map(n => _.padStart(n, pad, 0))
        const inputs = range.map(n => `${program.input}/${n}`)
    } else {
        const inputs = [program.input]
    }

    inputs.forEach(input => {
        main(input)
    })
    */
}()
