/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, constants, expectEvent, ether } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareTokenManager = artifacts.require('StockupShareTokenManager');
const TestStableToken = artifacts.require('TestStableToken');
const StockupShareToken = artifacts.require('StockupShareToken');
const StockupInvestorsRegistry = artifacts.require('StockupInvestorsRegistry');

contract('StockupShareToken', function([owner, issuer, anyone]) {
  const TOKEN_NAME = 'CompanyShareToken';
  const TOKEN_SYMBOL = 'CST';
  const RATE = ether('1');
  const INITIAL_SUPPLY = new BN(12);

  beforeEach(async function() {
    this.acceptedToken = await TestStableToken.new({ from: owner });
    this.token = await StockupShareToken.new(TOKEN_NAME, TOKEN_SYMBOL, { from: owner });
    this.registry = await StockupInvestorsRegistry.new({ from: owner });
  });

  it('requires a non-null token', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(ZERO_ADDRESS, this.acceptedToken.address, this.registry.address, issuer, RATE, {
        from: owner,
      }),
    );
  });

  it('requires a non-null accepted token', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(this.token.address, ZERO_ADDRESS, this.registry.address, issuer, RATE, {
        from: owner,
      }),
    );
  });

  it('requires accepted token non-equal token', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(this.token.address, this.token.address, this.registry.address, issuer, RATE, {
        from: owner,
      }),
    );
  });

  it('requires a non-null registry', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(this.token.address, this.acceptedToken.address, ZERO_ADDRESS, issuer, RATE, {
        from: owner,
      }),
    );
  });

  it('requires a non-null issuer', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(
        this.token.address,
        this.acceptedToken.address,
        this.registry.address,
        ZERO_ADDRESS,
        RATE,
        { from: owner },
      ),
    );
  });

  it('requires a non-null rate', async function() {
    await shouldFail.reverting(
      StockupShareTokenManager.new(
        this.token.address,
        this.acceptedToken.address,
        this.registry.address,
        issuer,
        new BN(0),
        { from: owner },
      ),
    );
  });

  context('with deployed token manager', async function() {
    beforeEach(async function() {
      this.manager = await StockupShareTokenManager.new(
        this.token.address,
        this.acceptedToken.address,
        this.registry.address,
        issuer,
        RATE,
        { from: owner },
      );

      await this.token.mint(this.manager.address, INITIAL_SUPPLY, { from: owner });

      await this.token.transferOwnership(this.manager.address, { from: owner });
    });

    it('should create and init manager contract with correct parameters', async function() {
      (await this.manager.token()).should.be.equal(this.token.address);
      (await this.manager.acceptedToken()).should.be.equal(this.acceptedToken.address);
      (await this.manager.investorsRegistry()).should.be.equal(this.registry.address);
      (await this.manager.issuer()).should.be.equal(issuer);
      (await this.manager.rate()).should.be.bignumber.equal(RATE);
      (await this.token.totalSupply()).should.be.bignumber.equal(INITIAL_SUPPLY);
      (await this.token.balanceOf(this.manager.address)).should.be.bignumber.equal(INITIAL_SUPPLY);
      (await this.manager.isIssuerVerified()).should.be.equal(false);
    });

    it('reverts on ether payments', async function() {
      await shouldFail.reverting(this.manager.sendTransaction({ from: owner, value: ether('1') }));
    });

    describe('issuer verification', function() {
      it('reverts verify by anyone', async function() {
        await shouldFail.reverting(this.manager.verify({ from: anyone }));
      });

      it('reverts verify by issuer', async function() {
        await shouldFail.reverting(this.manager.verify({ from: issuer }));
      });

      it('should verify issuer by owner', async function() {
        await this.manager.verify({ from: owner });
      });

      context('after issuer verification', async function() {
        beforeEach(async function() {
          ({ logs: this.logs } = await this.manager.verify({ from: owner }));
        });

        it('should set verified state to true', async function() {
          (await this.manager.isIssuerVerified()).should.be.equal(true);
        });

        it('should log verify event', async function() {
          expectEvent.inLogs(this.logs, 'IssuerVerified');
        });
      });
    });
  });
});
