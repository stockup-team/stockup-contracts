/* global artifacts contract context it beforeEach */
const { shouldFail, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('StockupInvestorsRegistry', function([owner, admin, investor, anotherInvestor, anyone]) {
  beforeEach(async function() {
    this.registry = await StockupInvestorsRegistry.new({ from: owner });
  });

  it('should add investor by owner', async function() {
    await this.registry.addInvestor(investor, { from: owner });
  });

  it('should add investor by admin', async function() {
    await this.registry.changeAdmin(admin, { from: owner });

    await this.registry.addInvestor(investor, { from: admin });
  });

  it('reverts add investor by anyone', async function() {
    await shouldFail.reverting(this.registry.addInvestor(investor, { from: anyone }));
  });

  it('should init with investors statuses as false', async function() {
    (await this.registry.isInvestor(investor)).should.be.equal(false);
    (await this.registry.isInvestor(anotherInvestor)).should.be.equal(false);
  });

  it('requires non-zero new investors account', async function() {
    await shouldFail.reverting(this.registry.addInvestor(ZERO_ADDRESS, { from: owner }));
  });

  it('reverts add investor when contract paused', async function() {
    await this.registry.pause({ from: owner });

    await shouldFail.reverting(this.registry.addInvestor(investor, { from: owner }));
  });

  context('with added investor', function() {
    beforeEach(async function() {
      ({ logs: this.logs } = await this.registry.addInvestor(investor, { from: owner }));
    });

    it('should get investor status as added', async function() {
      (await this.registry.isInvestor(investor)).should.be.equal(true);
    });

    it('revert on add investor twice', async function() {
      await shouldFail.reverting(this.registry.addInvestor(investor, { from: owner }));
    });

    it('should log add investor event', async function() {
      expectEvent.inLogs(this.logs, 'InvestorAdded', {
        account: investor,
      });
    });

    it('should remove investor by owner', async function() {
      await this.registry.removeInvestor(investor, { from: owner });
    });

    it('requires non-zero investors account to remove', async function() {
      await shouldFail.reverting(this.registry.removeInvestor(ZERO_ADDRESS, { from: owner }));
    });

    it('reverts on remove investor by admin', async function() {
      await this.registry.changeAdmin(admin, { from: owner });

      await shouldFail.reverting(this.registry.removeInvestor(investor, { from: admin }));
    });

    it('reverts on remove investor by anyone', async function() {
      await shouldFail.reverting(this.registry.removeInvestor(investor, { from: anyone }));
    });

    it('reverts remove investor when contract paused', async function() {
      await this.registry.pause({ from: owner });

      await shouldFail.reverting(this.registry.addInvestor(investor, { from: owner }));
    });

    context('with removed investor', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.registry.removeInvestor(investor, { from: owner }));
      });

      it('should get investor status as removed', async function() {
        (await this.registry.isInvestor(investor)).should.be.equal(false);
      });

      it('revert on remove investor twice', async function() {
        await shouldFail.reverting(this.registry.removeInvestor(investor, { from: owner }));
      });

      it('should log add investor event', async function() {
        expectEvent.inLogs(this.logs, 'InvestorRemoved', {
          account: investor,
        });
      });
    });
  });
});
