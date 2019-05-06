/* global artifacts contract it beforeEach */
const { BN } = require('openzeppelin-test-helpers');

const StockupShareToken = artifacts.require('StockupShareToken');

contract('StockupShareToken', function([owner]) {
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
});
