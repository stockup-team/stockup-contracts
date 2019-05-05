/* global artifacts contract describe context it beforeEach */
const { BN, shouldFail, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareToken = artifacts.require('StockupShareToken');

contract('StockupShareToken', function([owner, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  beforeEach(async function() {
    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: owner });
  });

  it('has a name', async function() {
    (await this.token.name()).should.equal(NAME);
  });

  it('has a symbol', async function() {
    (await this.token.symbol()).should.equal(SYMBOL);
  });

  it(`has 0 decimals`, async function() {
    (await this.token.decimals()).should.be.bignumber.equal(new BN(0));
  });

  it('should initialize with 0 total supply', async function() {
    (await this.token.totalSupply()).should.be.bignumber.equal(new BN(0));
  });

  describe('mint tokens', function() {
    beforeEach(async function() {
      this.value = new BN(5);
    });

    it('should mint tokens by owner', async function() {
      await this.token.mint(owner, this.value, { from: owner });
    });

    it('reverts on mint tokens by anyone', async function() {
      await shouldFail.reverting(this.token.mint(anyone, this.value, { from: anyone }));
    });

    it('requires non-zero tokens beneficiary', async function() {
      await shouldFail.reverting(this.token.mint(ZERO_ADDRESS, this.value, { from: owner }));
    });

    context('when tokens was minted', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.token.mint(owner, this.value, { from: owner }));
      });

      it('should mints the requested amount', async function() {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(this.value);
      });

      it('should log mint-transfer event', async function() {
        expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: owner,
          value: this.value,
        });
      });
    });
  });

  describe('burn tokens', function() {
    beforeEach(async function() {
      this.value = new BN(10);

      await this.token.mint(owner, this.value, { from: owner });
    });

    it('should burn tokens by owner', async function() {
      await this.token.burn(this.value, { from: owner });
    });

    it('reverts burn tokens by anyone', async function() {
      await shouldFail.reverting(this.token.burn(this.value, { from: anyone }));
    });

    context('when tokens was burned', function() {
      beforeEach(async function() {
        ({ logs: this.logs } = await this.token.burn(this.value, { from: owner }));
      });

      it('should burns the requested amount', async function() {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(new BN(0));
      });

      it('should log burn-transfer event', async function() {
        expectEvent.inLogs(this.logs, 'Transfer', {
          from: owner,
          to: ZERO_ADDRESS,
          value: this.value,
        });
      });
    });

    context('when anyone has tokens', function() {
      beforeEach(async function() {
        this.anyoneValue = new BN(1);

        await this.token.transfer(anyone, this.anyoneValue, { from: owner });
      });

      it('reverts burn self tokens', async function() {
        await shouldFail.reverting(this.token.burn(this.anyoneValue, { from: anyone }));
      });
    });
  });
});
