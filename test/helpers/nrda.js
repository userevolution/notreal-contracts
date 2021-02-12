async function addEditionCreators(nrdaContract) {
    nrdaContract.createActiveEdition = async (...args) => {
      args.splice(-1, 0, true);
      return await nrdaContract.createEdition(...args);
    }

    nrdaContract.createInactiveEdition = async (...args) => {
      args.splice(-1, 0, false);
      return await nrdaContract.createEdition(...args);
    }

    // Pre-mint isn't really a thing anymore,
    // this is here as a placeholder to prevent cascading test failures
    nrdaContract.createInactivePreMintedEdition = async (...args) => {
      const totalSupply = args.splice(-3, 1); 
      await nrdaContract.createInactiveEdition(...args);
      await nrdaContract.updateTotalSupply(args[0], totalSupply);
      return true
    }

    nrdaContract.createActivePreMintedEdition = async (...args) => {
      const totalSupply = args.splice(-3, 1); 
      await nrdaContract.createActiveEdition(...args);
      await nrdaContract.updateTotalSupply(args[0], totalSupply);
      return true
    }
}

module.exports = addEditionCreators;
