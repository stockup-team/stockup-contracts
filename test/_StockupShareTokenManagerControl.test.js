/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, ether } = require('openzeppelin-test-helpers');

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('_StockupShareTokenManagerControl', function([
  owner,
  issuer,
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
      issuer,
      RATE,
      { from: owner },
    );

    await this.token.mint(anotherInvestor, this.value, { from: owner });

    // Change owner of token to manager contract
    await this.token.transferOwnership(this.manager.address, { from: owner });
  });

  context('when issuer unverified', function() {
    it('reverts on mint tokens by issuer', async function() {
      await shouldFail.reverting(this.manager.mintTokens(this.value, { from: issuer }));
    });

    it('reverts on burn tokens by issuer', async function() {
      await this.token.transfer(this.manager.address, this.value, { from: anotherInvestor });
      await shouldFail.reverting(this.manager.burnTokens(this.value, { from: issuer }));
    });

    it('reverts on freeze tokens by issuer', async function() {
      await this.registry.addInvestor(investor, { from: owner });
      await shouldFail.reverting(this.manager.freezeTokens(investor, { from: issuer }));
      (await this.token.isFrozen(investor)).should.be.equal(false);
    });

    it('reverts on reissue tokens by issuer', async function() {
      await this.registry.addInvestor(anotherInvestor, { from: owner });
      await this.registry.addInvestor(investorReissuer, { from: owner });
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      await shouldFail.reverting(this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: issuer }));
      (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
      (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(new BN(0));
    });

    it('reverts on pause token by issuer', async function() {
      (await this.token.paused()).should.be.equal(false);
      await shouldFail.reverting(this.manager.pauseToken({ from: issuer }));
      (await this.token.paused()).should.be.equal(false);
    });
  });

  context('when issuer verified', function() {
    beforeEach(async function() {
      await this.manager.verify({ from: owner });
    });

    describe('mint tokens', function() {
      it('should mint tokens', async function() {
        await this.manager.mintTokens(this.value, { from: issuer });
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(this.value);
      });

      it('requires non-null value', async function() {
        await shouldFail.reverting(this.manager.mintTokens(new BN(0), { from: issuer }));
      });

      it('reverts on mint tokens by owner or anyone', async function() {
        await shouldFail.reverting(this.manager.mintTokens(this.value, { from: owner }));
        await shouldFail.reverting(this.manager.mintTokens(this.value, { from: anyone }));
      });
    });

    describe('burn tokens', function() {
      beforeEach(async function() {
        await this.manager.mintTokens(this.value, { from: issuer });
      });

      it('should burn tokens', async function() {
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(this.value);
        await this.manager.burnTokens(this.value, { from: issuer });
        (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(new BN('0'));
      });

      it('requires non-null value', async function() {
        await shouldFail.reverting(this.manager.burnTokens(new BN(0), { from: issuer }));
      });

      it('reverts on burn tokens by owner or anyone', async function() {
        await shouldFail.reverting(this.manager.burnTokens(this.value, { from: owner }));
        await shouldFail.reverting(this.manager.burnTokens(this.value, { from: anyone }));
      });
    });

    describe('freeze tokens', function() {
      it('reverts on freeze investors account', async function() {
        await shouldFail.reverting(this.manager.freezeTokens(investor, { from: issuer }));
      });

      context('when investor was added to investor registry', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(investor, { from: owner });
        });

        it('should freeze investors account by owner', async function() {
          await this.manager.freezeTokens(investor, { from: owner });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('should freeze investors account by issuer', async function() {
          await this.manager.freezeTokens(investor, { from: issuer });
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
          await this.manager.freezeTokens(investor, { from: issuer });
        });

        it('should unfreeze investors account by owner', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.unfreezeTokens(investor, { from: owner });
          (await this.token.isFrozen(investor)).should.be.equal(false);
        });

        it('should unfreeze investors account by issuer', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.unfreezeTokens(investor, { from: issuer });
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
            await shouldFail.reverting(this.manager.unfreezeTokens(investor, { from: issuer }));
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

        it('should reissue tokens by issuer', async function() {
          (await this.token.balanceOf(anotherInvestor)).should.be.bignumber.equal(this.value);
          await this.manager.reissueTokens(anotherInvestor, investorReissuer, { from: issuer });
          (await this.token.balanceOf(investorReissuer)).should.be.bignumber.equal(this.value);
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

      it('should pause tokens by issuer', async function() {
        (await this.token.paused()).should.be.equal(false);
        await this.manager.pauseToken({ from: issuer });
        (await this.token.paused()).should.be.equal(true);
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

      it('should unpause token by issuer', async function() {
        (await this.token.paused()).should.be.equal(true);
        await this.manager.unpauseToken({ from: issuer });
        (await this.token.paused()).should.be.equal(false);
      });

      it('reverts on unpause token by anyone', async function() {
        await shouldFail.reverting(this.manager.unpauseToken({ from: anyone }));
      });
    });

    context('when manager contract paused', function() {
      // beforeEach(async function() {});
    });
  });
});
