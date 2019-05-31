/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, ether } = require('openzeppelin-test-helpers');

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('_StockupShareTokenManagerControl', function([
  owner,
  admin,
  manager,
  investor,
  anotherInvestor,
  investorReissuer,
  anyone,
]) {
  const TOKEN_NAME = 'CompanyShareToken';
  const TOKEN_SYMBOL = 'CST';
  const RATE = ether('1');

  beforeEach(async function() {
    this.value = new BN('10');

    this.acceptedToken = await TestStableToken.new({ from: owner });
    this.token = await StockupShareToken.new(TOKEN_NAME, TOKEN_SYMBOL, { from: owner });
    this.registry = await StockupInvestorsRegistry.new({ from: owner });

    this.manager = await StockupShareTokenManager.new(
      this.token.address,
      this.acceptedToken.address,
      this.registry.address,
      admin,
      RATE,
      { from: owner },
    );

    await this.token.mint(anotherInvestor, this.value, { from: owner });

    // Change owner of token to manager contract
    await this.token.transferOwnership(this.manager.address, { from: owner });

    // Add manager account
    await this.manager.addManager(manager, { from: admin });
  });

  context('when issuer unverified', function() {
    it('reverts on mint tokens by admin', async function() {
      await shouldFail.reverting(this.manager.mintTokens(this.value, { from: admin }));
    });

    it('reverts on mint tokens by manager', async function() {
      await shouldFail.reverting(this.manager.mintTokens(this.value, { from: manager }));
    });

    it('reverts on mint tokens by owner', async function() {
      await shouldFail.reverting(this.manager.mintTokens(this.value, { from: owner }));
    });

    it('reverts on mint tokens by anyone', async function() {
      await shouldFail.reverting(this.manager.mintTokens(this.value, { from: anyone }));
    });

    it('reverts on burn tokens by admin', async function() {
      await this.token.transfer(this.manager.address, this.value, { from: anotherInvestor });
      await shouldFail.reverting(this.manager.burnTokens(this.value, { from: admin }));
    });

    it('reverts on burn tokens by manager', async function() {
      await this.token.transfer(this.manager.address, this.value, { from: anotherInvestor });
      await shouldFail.reverting(this.manager.burnTokens(this.value, { from: manager }));
    });

    it('reverts on burn tokens by owner', async function() {
      await this.token.transfer(this.manager.address, this.value, { from: anotherInvestor });
      await shouldFail.reverting(this.manager.burnTokens(this.value, { from: owner }));
    });

    it('reverts on burn tokens by anyone', async function() {
      await this.token.transfer(this.manager.address, this.value, { from: anotherInvestor });
      await shouldFail.reverting(this.manager.burnTokens(this.value, { from: anyone }));
    });

    it('reverts on freeze tokens by admin', async function() {
      await this.registry.addInvestor(investor, { from: owner });
      await shouldFail.reverting(this.manager.freezeTokens(investor, { from: admin }));
      (await this.token.isFrozen(investor)).should.be.equal(false);
    });

    it('reverts on freeze tokens by anyone', async function() {
      await this.registry.addInvestor(investor, { from: owner });
      await shouldFail.reverting(this.manager.freezeTokens(investor, { from: anyone }));
      (await this.token.isFrozen(investor)).should.be.equal(false);
    });

    it('reverts on freeze tokens by manager', async function() {
      await this.registry.addInvestor(investor, { from: owner });
      await shouldFail.reverting(this.manager.freezeTokens(investor, { from: manager }));
      (await this.token.isFrozen(investor)).should.be.equal(false);
    });

    it('should freeze/unfreeze tokens by owner', async function() {
      await this.registry.addInvestor(investor, { from: owner });
      (await this.token.isFrozen(investor)).should.be.equal(false);
      await this.manager.freezeTokens(investor, { from: owner });
      (await this.token.isFrozen(investor)).should.be.equal(true);
      await this.manager.unfreezeTokens(investor, { from: owner });
      (await this.token.isFrozen(investor)).should.be.equal(false);
    });

    it('reverts on reissue tokens by admin', async function() {
      await this.registry.addInvestor(anotherInvestor, { from: owner });
      await this.registry.addInvestor(investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: admin }));
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(new BN(0));
    });

    it('reverts on reissue tokens by manager', async function() {
      await this.registry.addInvestor(anotherInvestor, { from: owner });
      await this.registry.addInvestor(investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: admin }));
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(new BN(0));
    });

    it('reverts on reissue tokens by anyone', async function() {
      await this.registry.addInvestor(anotherInvestor, { from: owner });
      await this.registry.addInvestor(investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: anyone }));
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(new BN(0));
    });

    it('should reissue tokens by owner', async function() {
      await this.registry.addInvestor(anotherInvestor, { from: owner });
      await this.registry.addInvestor(investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      await this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(new BN(0));
      (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(this.value);
    });

    it('reverts on pause token by admin', async function() {
      (await this.token.paused()).should.be.equal(false);
      await shouldFail.reverting(this.manager.pauseToken({ from: admin }));
      (await this.token.paused()).should.be.equal(false);
    });

    it('reverts on pause token by manager', async function() {
      (await this.token.paused()).should.be.equal(false);
      await shouldFail.reverting(this.manager.pauseToken({ from: manager }));
      (await this.token.paused()).should.be.equal(false);
    });

    it('reverts on pause token by anyone', async function() {
      (await this.token.paused()).should.be.equal(false);
      await shouldFail.reverting(this.manager.pauseToken({ from: anyone }));
      (await this.token.paused()).should.be.equal(false);
    });

    it('should pause/unpause token by owner', async function() {
      (await this.token.paused()).should.be.equal(false);
      await this.manager.pauseToken({ from: owner });
      (await this.token.paused()).should.be.equal(true);
      await this.manager.unpauseToken({ from: owner });
      (await this.token.paused()).should.be.equal(false);
    });
  });

  context('when issuer verified', function() {
    beforeEach(async function() {
      await this.manager.verify({ from: owner });
    });

    describe('mint tokens', function() {
      it('should mint tokens by admin', async function() {
        await this.manager.mintTokens(this.value, { from: admin });
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(this.value);
      });

      it('requires non-null value', async function() {
        await shouldFail.reverting(this.manager.mintTokens(new BN(0), { from: admin }));
      });

      it('reverts on mint tokens by owner', async function() {
        await shouldFail.reverting(this.manager.mintTokens(this.value, { from: owner }));
      });

      it('reverts on mint tokens by anyone', async function() {
        await shouldFail.reverting(this.manager.mintTokens(this.value, { from: anyone }));
      });

      it('reverts on mint tokens by manager', async function() {
        await shouldFail.reverting(this.manager.mintTokens(this.value, { from: manager }));
      });
    });

    describe('burn tokens', function() {
      beforeEach(async function() {
        await this.manager.mintTokens(this.value, { from: admin });
      });

      it('should burn tokens', async function() {
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(this.value);
        await this.manager.burnTokens(this.value, { from: admin });
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(new BN('0'));
      });

      it('requires non-null value', async function() {
        await shouldFail.reverting(this.manager.burnTokens(new BN(0), { from: admin }));
      });

      it('reverts on burn tokens by owner', async function() {
        await shouldFail.reverting(this.manager.burnTokens(this.value, { from: owner }));
      });

      it('reverts on burn tokens by anyone', async function() {
        await shouldFail.reverting(this.manager.burnTokens(this.value, { from: anyone }));
      });

      it('reverts on burn tokens by manager', async function() {
        await shouldFail.reverting(this.manager.burnTokens(this.value, { from: manager }));
      });
    });

    describe('freeze tokens', function() {
      it('reverts on freeze investors account', async function() {
        await shouldFail.reverting(this.manager.freezeTokens(investor, { from: admin }));
        await shouldFail.reverting(this.manager.freezeTokens(investor, { from: manager }));
      });

      context('when investor was added to investor registry', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(investor, { from: owner });
        });

        it('should freeze investors account by owner', async function() {
          await this.manager.freezeTokens(investor, { from: owner });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('should freeze investors account by admin', async function() {
          await this.manager.freezeTokens(investor, { from: admin });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('should freeze investors account by manager', async function() {
          await this.manager.freezeTokens(investor, { from: manager });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('reverts on freeze by anyone', async function() {
          await shouldFail.reverting(this.manager.freezeTokens(investor, { from: anyone }));
        });
      });
    });

    describe('unfreeze tokens', function() {
      context('when investor was added to investor registry and frozen', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(investor, { from: owner });
          await this.manager.freezeTokens(investor, { from: admin });
        });

        it('should unfreeze investors account by owner', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.unfreezeTokens(investor, { from: owner });
          (await this.token.isFrozen(investor)).should.be.equal(false);
        });

        it('should unfreeze investors account by admin', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.unfreezeTokens(investor, { from: admin });
          (await this.token.isFrozen(investor)).should.be.equal(false);
        });

        it('should unfreeze investors account by manager', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.unfreezeTokens(investor, { from: manager });
          (await this.token.isFrozen(investor)).should.be.equal(false);
        });

        it('reverts on freeze by anyone', async function() {
          await shouldFail.reverting(this.manager.unfreezeTokens(investor, { from: anyone }));
        });

        context('when investor was removed from investor registry', function() {
          beforeEach(async function() {
            await this.registry.removeInvestor(investor, { from: owner });
          });

          it('reverts on unfreeze investors account', async function() {
            await shouldFail.reverting(this.manager.unfreezeTokens(investor, { from: admin }));
          });
        });
      });
    });

    describe('reissue tokens', function() {
      it('reverts on reissue tokens when from account not in registry', async function() {
        await this.registry.addInvestor(investorReissuer, { from: owner });
        await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: owner }));
      });

      it('reverts on reissue tokens when to account not in registry', async function() {
        await this.registry.addInvestor(anotherInvestor, { from: owner });
        await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: owner }));
      });

      context('when both investors accounts was added to investor registry', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(anotherInvestor, { from: owner });
          await this.registry.addInvestor(investorReissuer, { from: owner });
        });

        it('should reissue tokens by owner', async function() {
          (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
          await this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: owner });
          (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(this.value);
        });

        it('should reissue tokens by admin', async function() {
          (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
          await this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: admin });
          (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(this.value);
        });

        it('reverts on reissue tokens by manager', async function() {
          await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: manager }));
        });

        it('reverts on reissue tokens by anyone', async function() {
          await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: anyone }));
        });

        it('should reissue tokens by owner when from account frozen (lost investors access scenario)', async function() {
          await this.manager.freezeTokens(anotherInvestor, { from: owner });
          (await this.token.isFrozen(anotherInvestor)).should.be.equal(true);
          (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
          await this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: owner });
          (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(this.value);
        });
      });
    });

    describe('pause token', function() {
      it('should pause tokens by owner', async function() {
        (await this.token.paused()).should.be.equal(false);
        await this.manager.pauseToken({ from: owner });
        (await this.token.paused()).should.be.equal(true);
      });

      it('should pause tokens by admin', async function() {
        (await this.token.paused()).should.be.equal(false);
        await this.manager.pauseToken({ from: admin });
        (await this.token.paused()).should.be.equal(true);
      });

      it('reverts on pause token by manager', async function() {
        await shouldFail.reverting(this.manager.pauseToken({ from: manager }));
      });

      it('reverts on pause token by anyone', async function() {
        await shouldFail.reverting(this.manager.pauseToken({ from: anyone }));
      });
    });

    describe('unpause token', function() {
      beforeEach(async function() {
        await this.manager.pauseToken({ from: owner });
      });

      it('should unpause token by owner', async function() {
        (await this.token.paused()).should.be.equal(true);
        await this.manager.unpauseToken({ from: owner });
        (await this.token.paused()).should.be.equal(false);
      });

      it('should unpause token by admin', async function() {
        (await this.token.paused()).should.be.equal(true);
        await this.manager.unpauseToken({ from: admin });
        (await this.token.paused()).should.be.equal(false);
      });

      it('reverts on pause token by manager', async function() {
        await shouldFail.reverting(this.manager.pauseToken({ from: manager }));
      });

      it('reverts on unpause token by anyone', async function() {
        await shouldFail.reverting(this.manager.unpauseToken({ from: anyone }));
      });
    });
  });
});
