/* global artifacts contract context it beforeEach */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers');

const PausableMock = artifacts.require('PausableMock');

contract('Pausable', function([owner, anyone]) {
  beforeEach(async function() {
    this.contract = await PausableMock.new({ from: owner });
  });

  it('should initialize with unpaused state', async function() {
    (await this.contract.paused()).should.be.equal(false);
  });

  it('reverts on pause by anyone', async function() {
    await shouldFail.reverting(this.contract.pause({ from: anyone }));
  });

  it('should pause by owner', async function() {
    await this.contract.pause({ from: owner });
  });

  context('when paused', function() {
    beforeEach(async function() {
      ({ logs: this.logs } = await this.contract.pause({ from: owner }));
    });

    it('should be paused', async function() {
      (await this.contract.paused()).should.be.equal(true);
    });

    it('should log pause event', async function() {
      expectEvent.inLogs(this.logs, 'Paused');
    });

    it('reverts on pause', async function() {
      await shouldFail.reverting(this.contract.pause({ from: owner }));
    });

    it('reverts on call pausable restricted function (when not paused)', async function() {
      await shouldFail.reverting(this.contract.whenNotPausedFunction({ from: anyone }));
    });

    it('should call pausable restricted function (when paused)', async function() {
      await this.contract.whenPausedFunction({ from: anyone });
    });

    it('reverts on unpause by anyone', async function() {
      await shouldFail.reverting(this.contract.unpause({ from: anyone }));
    });

    it('should unpause by owner', async function() {
      await this.contract.unpause({ from: owner });
    });

    context('when unpaused', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.contract.unpause({ from: owner }));
      });

      it('should be unpaused', async function() {
        (await this.contract.paused()).should.be.equal(false);
      });

      it('should log unpause event', async function() {
        expectEvent.inLogs(this.logs, 'Unpaused');
      });

      it('reverts on unpause', async function() {
        await shouldFail.reverting(this.contract.unpause({ from: owner }));
      });

      it('reverts on call pausable restricted function (when paused)', async function() {
        await shouldFail.reverting(this.contract.whenPausedFunction({ from: anyone }));
      });

      it('should call pausable restricted function (when not paused)', async function() {
        await this.contract.whenNotPausedFunction({ from: anyone });
      });
    });
  });
});
