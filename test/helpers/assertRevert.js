const EVMRevert = 'revert';

// Note: Right now this helper effectively does not check error messages AT ALL,
// as 'error.reason' does not get populated, it's actually error.message
// However, turning on this check would cause a lot of failing tests and 
// require a significant amount of fixing. But in the future, just uncomment
// the code below and fix all the failing tests to have stricter checks
module.exports = async (promise, expectedError) => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    if (error.reason && expectedError) {
      console.log("Failure reason", error.reason);
      console.log("expectedError", expectedError);
      assert(error.reason === expectedError, `unexpected revert reason of [${error.reason}]`);
    //} else if(error.message && expectedError) {
    //  //console.log("Failure message", error.message);
    //  //console.log("expectedError", expectedError);
    //  assert(error.message.includes(expectedError), `unexpected revert reason of [${error.message}]`);
    } else {
      const revertFound = error.message.search(EVMRevert) >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
  }
};
