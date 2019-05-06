/* global artifacts contract context it beforeEach */
const { BN, shouldFail, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareToken = artifacts.require('StockupShareToken');

contract('_StockupShareTokenMintable', function([owner, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  beforeEach(async function() {
    this.value = new BN(5);

    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: owner });
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
