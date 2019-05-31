/* global artifacts contract context it beforeEach */
const { shouldFail, expectEvent, ether } = require('openzeppelin-test-helpers');

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('_StockupShareTokenManagerWhitelist', function([owner, admin, manager, investor, anyone]) {
  const TOKEN_NAME = 'CompanyShareToken';
  const TOKEN_SYMBOL = 'CST';
  const RATE = ether('1');

  beforeEach(async function() {
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

    await this.manager.addManager(manager, { from: admin });
  });

  context('when issuer unverified', function() {
    beforeEach(async function() {
      await this.registry.addInvestor(investor, { from: owner });
    });

    it('reverts add investor account to whitelist by admin', async function() {
      await shouldFail.reverting(this.manager.addToWhitelist(investor, { from: admin }));
    });

    it('reverts add investor account to whitelist by manager', async function() {
      await shouldFail.reverting(this.manager.addToWhitelist(investor, { from: manager }));
    });

    it('reverts add investor account to whitelist by anyone', async function() {
      await shouldFail.reverting(this.manager.addToWhitelist(investor, { from: anyone }));
    });

    it('should add investor account to whitelist by owner', async function() {
      await this.manager.addToWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
    });

    it('reverts remove investor account from whitelist by admin', async function() {
      await this.manager.addToWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
      await shouldFail.reverting(this.manager.removeFromWhitelist(investor, { from: admin }));
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
    });

    it('reverts remove investor account from whitelist by manager', async function() {
      await this.manager.addToWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
      await shouldFail.reverting(this.manager.removeFromWhitelist(investor, { from: manager }));
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
    });

    it('reverts remove investor account from whitelist by anyone', async function() {
      await this.manager.addToWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
      await shouldFail.reverting(this.manager.removeFromWhitelist(investor, { from: anyone }));
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
    });

    it('should remove investor account from whitelist by owner', async function() {
      await this.manager.addToWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(true);
      await this.manager.removeFromWhitelist(investor, { from: owner });
      (await this.manager.isWhitelisted(investor)).should.be.equal(false);
    });
  });

  context('when issuer verified', function() {
    beforeEach(async function() {
      await this.manager.verify({ from: owner });
    });

    it('reverts on add to whitelist no investor account', async function() {
      await shouldFail.reverting(this.manager.addToWhitelist(investor, { from: owner }));
    });

    context('when investor added in registry', function() {
      beforeEach(async function() {
        await this.registry.addInvestor(investor, { from: owner });
      });

      it('should init whitelisted state to false', async function() {
        (await this.manager.isWhitelisted(investor)).should.be.equal(false);
      });

      it('should add investor to whitelist by admin', async function() {
        await this.manager.addToWhitelist(investor, { from: admin });
      });

      it('should add investor to whitelist by manager', async function() {
        await this.manager.addToWhitelist(investor, { from: manager });
      });

      it('should add investor to whitelist by owner', async function() {
        await this.manager.addToWhitelist(investor, { from: owner });
      });

      it('reverts on add investor to whitelist by anyone', async function() {
        await shouldFail.reverting(this.manager.addToWhitelist(investor, { from: anyone }));
      });

      context('when investor added to whitelist', function() {
        beforeEach(async function() {
          ({ logs: this.logs } = await this.manager.addToWhitelist(investor, { from: owner }));
        });

        it('should set whitelisted state to true', async function() {
          (await this.manager.isWhitelisted(investor)).should.be.equal(true);
        });

        it('should log add event', async function() {
          expectEvent.inLogs(this.logs, 'WhitelistAdded', {
            account: investor,
          });
        });

        it('should remove investor from whitelist by admin', async function() {
          await this.manager.removeFromWhitelist(investor, { from: admin });
        });

        it('should remove investor from whitelist by manager', async function() {
          await this.manager.removeFromWhitelist(investor, { from: manager });
        });

        it('should remove investor from whitelist by owner', async function() {
          await this.manager.removeFromWhitelist(investor, { from: owner });
        });

        it('reverts on remove investor from whitelist by anyone', async function() {
          await shouldFail.reverting(this.manager.removeFromWhitelist(investor, { from: anyone }));
        });

        context('when investor removed from whitelist', function() {
          beforeEach(async function() {
            ({ logs: this.logs } = await this.manager.removeFromWhitelist(investor, { from: owner }));
          });

          it('should set whitelisted state to false', async function() {
            (await this.manager.isWhitelisted(investor)).should.be.equal(false);
          });

          it('should log add event', async function() {
            expectEvent.inLogs(this.logs, 'WhitelistRemoved', {
              account: investor,
            });
          });
        });
      });
    });
  });
});
