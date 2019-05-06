/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, expectEvent } = require('openzeppelin-test-helpers');

const StockupShareToken = artifacts.require('StockupShareToken');

contract('_StockupShareTokenPausable', function([owner, tokenholder, recipient, spender, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  const successInterfaceMethods = function() {
    beforeEach(async function() {
      this.value = new BN(12);
    });

    it('should complete mint', async function() {
      await this.token.mint(tokenholder, this.value, { from: owner });
    });

    it('should complete burn', async function() {
      await this.token.mint(owner, this.value, { from: owner });
      await this.token.burn(this.value, { from: owner });
    });

    it('should complete freeze', async function() {
      await this.token.freeze(tokenholder, { from: owner });
    });

    it('should complete unfreeze', async function() {
      await this.token.freeze(tokenholder, { from: owner });
      await this.token.unfreeze(tokenholder, { from: owner });
    });

    it('should complete reissue', async function() {
      await this.token.reissue(tokenholder, recipient, { from: owner });
    });

    it('should complete transfer', async function() {
      await this.token.mint(tokenholder, this.value, { from: owner });
      await this.token.transfer(recipient, this.value, { from: tokenholder });
    });

    it('should complete approve', async function() {
      await this.token.approve(spender, this.value, { from: tokenholder });
    });

    it('should complete transferFrom', async function() {
      await this.token.mint(tokenholder, this.value, { from: owner });
      await this.token.approve(spender, this.value, { from: tokenholder });
      await this.token.transferFrom(tokenholder, recipient, this.value, { from: spender });
    });

    it('should complete increaseAllowance', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });
    });

    it('should complete decreaseAllowance', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });
      await this.token.decreaseAllowance(spender, this.value, { from: tokenholder });
    });
  };

  const revertInterfaceMethods = function() {
    beforeEach(async function() {
      this.value = new BN(12);
    });

    it('reverts mint', async function() {
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.mint(tokenholder, this.value, { from: owner }));
    });

    it('reverts burn', async function() {
      await this.token.mint(owner, this.value, { from: owner });
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.burn(this.value, { from: owner }));
    });

    it('reverts freeze', async function() {
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.freeze(tokenholder, { from: owner }));
    });

    it('reverts unfreeze', async function() {
      await this.token.freeze(tokenholder, { from: owner });
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.unfreeze(tokenholder, { from: owner }));
    });

    it('reverts reissue', async function() {
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.reissue(tokenholder, recipient, { from: owner }));
    });

    it('reverts transfer', async function() {
      await this.token.mint(tokenholder, this.value, { from: owner });
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.transfer(recipient, this.value, { from: tokenholder }));
    });

    it('reverts approve', async function() {
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.approve(spender, this.value, { from: tokenholder }));
    });

    it('reverts transferFrom', async function() {
      await this.token.mint(tokenholder, this.value, { from: owner });
      await this.token.approve(spender, this.value, { from: tokenholder });
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.transferFrom(tokenholder, recipient, this.value, { from: spender }));
    });

    it('reverts increaseAllowance', async function() {
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.increaseAllowance(spender, this.value, { from: tokenholder }));
    });

    it('reverts decreaseAllowance', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });
      await this.token.pause({ from: owner });
      await shouldFail.reverting(this.token.decreaseAllowance(spender, this.value, { from: tokenholder }));
    });
  };

  beforeEach(async function() {
    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: owner });
  });

  it('should init with false paused status', async function() {
    (await this.token.paused()).should.equal(false);
  });

  it('should pause by owner', async function() {
    await this.token.pause({ from: owner });
  });

  it('reverts on pause by anyone', async function() {
    await shouldFail.reverting(this.token.pause({ from: anyone }));
  });

  describe('interface methods', successInterfaceMethods);

  context('after pause', function() {
    beforeEach(async function() {
      ({ logs: this.logs } = await this.token.pause({ from: owner }));
    });

    it('reverts on pause twice', async function() {
      await shouldFail.reverting(this.token.pause({ from: owner }));
    });

    it('should set paused status to true', async function() {
      (await this.token.paused()).should.equal(true);
    });

    it('should log pause event', async function() {
      expectEvent.inLogs(this.logs, 'Paused');
    });

    it('should unpause by owner', async function() {
      await this.token.unpause({ from: owner });
    });

    it('reverts on unpause by anyone', async function() {
      await shouldFail.reverting(this.token.unpause({ from: anyone }));
    });

    context('after unpause', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.token.unpause({ from: owner }));
      });

      it('reverts on unpause twice', async function() {
        await shouldFail.reverting(this.token.unpause({ from: owner }));
      });

      it('should set paused status to false', async function() {
        (await this.token.paused()).should.equal(false);
      });

      it('should log unpause event', async function() {
        expectEvent.inLogs(this.logs, 'Unpaused');
      });

      describe('interface methods', successInterfaceMethods);
    });
  });

  describe('interface methods after pause', revertInterfaceMethods);
});
