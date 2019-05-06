/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareToken = artifacts.require('StockupShareToken');

contract('_StockupShareTokenFreezable', function([owner, tokenholder, recipient, spender, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  beforeEach(async function() {
    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: owner });
  });

  it('should freeze given account by owner', async function() {
    await this.token.freeze(tokenholder, { from: owner });
  });

  it('should get account status as unfrozen', async function() {
    (await this.token.isFrozen(tokenholder)).should.be.equal(false);
  });

  it('reverts freeze by anyone', async function() {
    await shouldFail.reverting(this.token.freeze(tokenholder, { from: anyone }));
  });

  it('requires non-zero account', async function() {
    await shouldFail.reverting(this.token.freeze(ZERO_ADDRESS, { from: owner }));
  });

  describe('erc20 interface', function() {
    beforeEach(async function() {
      this.value = new BN(12);

      await this.token.mint(owner, this.value, { from: owner });

      await this.token.transfer(tokenholder, this.value, { from: owner });
    });

    it('should complete transfer', async function() {
      await this.token.transfer(recipient, this.value, { from: tokenholder });
    });

    it('should complete approve', async function() {
      await this.token.approve(spender, this.value, { from: tokenholder });
    });

    it('should complete increaseAllowance', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });
    });

    it('should complete decreaseAllowance', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });

      await this.token.decreaseAllowance(spender, this.value, { from: tokenholder });
    });

    it('reverts on transferFrom from frozen account by spender', async function() {
      await this.token.approve(spender, this.value, { from: tokenholder });

      await this.token.freeze(tokenholder, { from: owner });

      await shouldFail.reverting(this.token.transferFrom(tokenholder, recipient, this.value, { from: spender }));
    });

    it('reverts on transferFrom from unfrozen account by frozen account', async function() {
      await this.token.approve(spender, this.value, { from: tokenholder });

      await this.token.freeze(spender, { from: owner });

      await shouldFail.reverting(this.token.transferFrom(tokenholder, recipient, this.value, { from: spender }));
    });

    it('reverts on decreaseAllowance by frozen account', async function() {
      await this.token.increaseAllowance(spender, this.value, { from: tokenholder });

      await this.token.freeze(tokenholder, { from: owner });

      await shouldFail.reverting(this.token.decreaseAllowance(spender, this.value, { from: tokenholder }));
    });

    context('when account was frozen', function() {
      beforeEach(async function() {
        await this.token.freeze(tokenholder, { from: owner });
      });

      it('reverts on transfer', async function() {
        await shouldFail.reverting(this.token.transfer(recipient, this.value, { from: tokenholder }));
      });

      it('reverts on approve', async function() {
        await shouldFail.reverting(this.token.approve(spender, this.value, { from: tokenholder }));
      });

      it('reverts on increaseAllowance', async function() {
        await shouldFail.reverting(this.token.increaseAllowance(spender, this.value, { from: tokenholder }));
      });

      context('when tokenholder account was unfrozen', function() {
        beforeEach(async function() {
          await this.token.unfreeze(tokenholder, { from: owner });
        });

        it('should complete transfer', async function() {
          await this.token.transfer(recipient, this.value, { from: tokenholder });
        });

        it('should complete approve', async function() {
          await this.token.approve(spender, this.value, { from: tokenholder });
        });

        it('should complete increaseAllowance', async function() {
          await this.token.increaseAllowance(spender, this.value, { from: tokenholder });
        });

        it('should complete decreaseAllowance', async function() {
          await this.token.increaseAllowance(spender, this.value, { from: tokenholder });

          await this.token.decreaseAllowance(spender, this.value, { from: tokenholder });
        });
      });
    });
  });

  context('when account was frozen', function() {
    beforeEach(async function() {
      ({ logs: this.logs } = await this.token.freeze(tokenholder, { from: owner }));
    });

    it('should get account status as frozen', async function() {
      (await this.token.isFrozen(tokenholder)).should.be.equal(true);
    });

    it('revert on freeze twice', async function() {
      await shouldFail.reverting(this.token.freeze(tokenholder, { from: owner }));
    });

    it('should log freeze event', async function() {
      expectEvent.inLogs(this.logs, 'Freeze', {
        account: tokenholder,
      });
    });

    it('should unfreeze given account by owner', async function() {
      await this.token.unfreeze(tokenholder, { from: owner });
    });

    it('reverts unfreeze by anyone', async function() {
      await shouldFail.reverting(this.token.unfreeze(tokenholder, { from: anyone }));
    });

    it('requires non-zero account in unfreeze function', async function() {
      await shouldFail.reverting(this.token.unfreeze(ZERO_ADDRESS, { from: owner }));
    });

    context('when tokenholder account was unfrozen', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.token.unfreeze(tokenholder, { from: owner }));
      });

      it('revert on unfreeze twice', async function() {
        await shouldFail.reverting(this.token.unfreeze(tokenholder, { from: owner }));
      });

      it('should log unfreeze event', async function() {
        expectEvent.inLogs(this.logs, 'Unfreeze', {
          account: tokenholder,
        });
      });
    });
  });
});
