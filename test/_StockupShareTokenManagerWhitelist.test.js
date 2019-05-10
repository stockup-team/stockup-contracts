/* global artifacts contract context it beforeEach */
const { shouldFail, expectEvent, ether } = require('openzeppelin-test-helpers');

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('StockupShareToken', function([owner, issuer, investor, anyone]) {
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
      issuer,
      RATE,
      { from: owner },
    );
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

    it('should add investor to whitelist by issuer', async function() {
      await this.manager.addToWhitelist(investor, { from: issuer });
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

      it('should remove investor from whitelist by issuer', async function() {
        await this.manager.removeFromWhitelist(investor, { from: issuer });
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
