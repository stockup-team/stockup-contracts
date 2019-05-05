/* global artifacts contract context it beforeEach */
const { BN, shouldFail } = require('openzeppelin-test-helpers');

const StockupShareToken = artifacts.require('StockupShareToken');

contract('StockupShareToken', function([creator, minter, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  beforeEach(async function() {
    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: creator });
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

  context('with minted tokens to minter', function() {
    beforeEach(async function() {
      this.value = new BN(10);

      await this.token.addMinter(minter, { from: creator });
      await this.token.renounceMinter({ from: creator });

      await this.token.mint(minter, this.value, { from: minter });
    });

    it('should burn tokens by minter', async function() {
      await this.token.burn(this.value, { from: minter });
    });

    it('reverts burn tokens by anyone', async function() {
      await shouldFail.reverting(this.token.burn(this.value, { from: anyone }));
    });

    context('when anyone has tokens', function() {
      beforeEach(async function() {
        this.anyoneValue = new BN(1);

        await this.token.transfer(anyone, this.anyoneValue, { from: minter });
      });

      it('reverts burn tokens by anyone', async function() {
        await shouldFail.reverting(this.token.burn(this.anyoneValue, { from: anyone }));
      });
    });
  });
});
