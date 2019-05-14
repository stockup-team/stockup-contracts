/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, ether, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('_StockupShareTokenManagerPurchase', function([owner, issuer, investor, anotherInvestor, anyone]) {
  const TOKEN_NAME = 'CompanyShareToken';
  const TOKEN_SYMBOL = 'CST';
  const RATE = ether('1'); // 1 share = 1 stable token with 18 decimals

  beforeEach(async function() {
    this.amount = new BN('10');
    this.value = this.amount.mul(RATE);

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

    await this.token.mint(this.manager.address, this.amount, { from: owner });

    // Change owner of token to manager contract
    await this.token.transferOwnership(this.manager.address, { from: owner });
  });

  describe('1. manual tokens transfer', function() {
    context('when issuer unverified', function() {
      it('reverts on transfer', async function() {
        await shouldFail.reverting(this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer }));
      });
    });

    context('when issuer verified', function() {
      beforeEach(async function() {
        await this.manager.verify({ from: owner });
      });

      it('reverts transfer when investor no in investors registry', async function() {
        await shouldFail.reverting(this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer }));
      });

      context('when investor was added to investors registry', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(investor, { from: owner });
        });

        it('should transfer by issuer', async function() {
          await this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer });
        });

        it('reverts on transfer by owner', async function() {
          await shouldFail.reverting(this.manager.transferTokensToBeneficiary(investor, this.amount, { from: owner }));
        });

        it('reverts on transfer by anyone', async function() {
          await shouldFail.reverting(this.manager.transferTokensToBeneficiary(investor, this.amount, { from: anyone }));
        });

        it('should freeze investor account and transfer tokens', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(false);
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(new BN(0));
          await this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer });
          (await this.token.isFrozen(investor)).should.be.equal(true);
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(this.amount);
        });

        it('should transfer tokens when investors account already was frozen', async function() {
          await this.manager.freezeTokens(investor, { from: issuer });
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('reverts transfer frozen tokens from investor to another investor', async function() {
          await this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer });
          await shouldFail.reverting(this.token.transfer(anotherInvestor, this.amount, { from: investor }));
        });

        it('requires non-null beneficiary', async function() {
          await shouldFail.reverting(
            this.manager.transferTokensToBeneficiary(ZERO_ADDRESS, this.amount, { from: issuer }),
          );
        });

        it('requires non-null amount', async function() {
          await shouldFail.reverting(this.manager.transferTokensToBeneficiary(investor, new BN(0), { from: issuer }));
        });

        context('when investor was added to whitelist', function() {
          beforeEach(async function() {
            await this.manager.addToWhitelist(investor, { from: issuer });
          });

          it('should transfer tokens without freeze investors account', async function() {
            (await this.token.isFrozen(investor)).should.be.equal(false);
            await this.manager.transferTokensToBeneficiary(investor, this.amount, { from: issuer });
            (await this.token.isFrozen(investor)).should.be.equal(false);
          });

          context('when tokens was transferred', function() {
            beforeEach(async function() {
              ({ logs: this.logs } = await this.manager.transferTokensToBeneficiary(investor, this.amount, {
                from: issuer,
              }));
            });

            it('should complete correct transfer', async function() {
              (await this.token.balanceOf(investor)).should.be.bignumber.equal(this.amount);
            });

            it('should log manual transfer tokens event', async function() {
              expectEvent.inLogs(this.logs, 'TokensTransferred', {
                beneficiary: investor,
                amount: this.amount,
              });
            });
          });
        });
      });
    });
  });

  describe('2. buy tokens', function() {
    beforeEach(async function() {
      // Transfer stable tokens to investors account
      await this.acceptedToken.transfer(investor, this.value, { from: owner });

      // Approve spent funds from investor account by manager contract
      await this.acceptedToken.approve(this.manager.address, this.value, { from: investor });
    });

    context('when issuer unverified', function() {
      it('reverts on purchase', async function() {
        await this.registry.addInvestor(investor, { from: owner });
        await shouldFail.reverting(this.manager.buyTokens(this.amount, { from: investor }));
      });
    });

    context('when issuer verified', function() {
      beforeEach(async function() {
        await this.manager.verify({ from: owner });
      });

      it('reverts purchase when investor no in investors registry', async function() {
        await shouldFail.reverting(this.manager.buyTokens(this.amount, { from: investor }));
      });

      context('when investor was added to investors registry', function() {
        beforeEach(async function() {
          await this.registry.addInvestor(investor, { from: owner });
        });

        it('should purchase tokens', async function() {
          await this.manager.buyTokens(this.amount, { from: investor });
        });

        it('should freeze investor account and purchase tokens', async function() {
          (await this.token.isFrozen(investor)).should.be.equal(false);
          await this.manager.buyTokens(this.amount, { from: investor });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('should purchase tokens when investors account already was frozen', async function() {
          await this.manager.freezeTokens(investor, { from: issuer });
          (await this.token.isFrozen(investor)).should.be.equal(true);
          await this.manager.buyTokens(this.amount, { from: investor });
          (await this.token.isFrozen(investor)).should.be.equal(true);
        });

        it('reverts transfer frozen tokens from investor to another investor', async function() {
          await this.manager.buyTokens(this.amount, { from: investor });
          await shouldFail.reverting(this.token.transfer(anotherInvestor, this.amount, { from: investor }));
        });

        context('when investor was added to whitelist', function() {
          beforeEach(async function() {
            await this.manager.addToWhitelist(investor, { from: issuer });
          });

          it('should purchase tokens without freeze investors account', async function() {
            (await this.token.isFrozen(investor)).should.be.equal(false);
            await this.manager.buyTokens(this.amount, { from: investor });
            (await this.token.isFrozen(investor)).should.be.equal(false);
          });

          context('when tokens was bought', function() {
            beforeEach(async function() {
              ({ logs: this.logs } = await this.manager.buyTokens(this.amount, {
                from: investor,
              }));
            });

            it('should transfer purchased tokens to investor', async function() {
              (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(new BN(0));
              (await this.token.balanceOf(investor)).should.be.bignumber.equal(this.amount);
            });

            it('should keep raised stable tokens on manager contract', async function() {
              (await this.acceptedToken.balanceOf(investor)).should.be.bignumber.equal(new BN(0));
              (await this.acceptedToken.balanceOf(this.manager.address)).should.be.bignumber.equal(this.value);
            });

            it('should log purchase tokens event', async function() {
              expectEvent.inLogs(this.logs, 'TokensPurchased', {
                purchaser: investor,
                beneficiary: investor,
                value: this.value,
                amount: this.amount,
              });
            });
          });
        });
      });
    });
  });

  describe('3. withdraw raised', function() {});
});
