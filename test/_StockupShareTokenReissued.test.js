/* global artifacts contract context it beforeEach */
const { BN, shouldFail, constants, expectEvent } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const StockupShareToken = artifacts.require('StockupShareToken');

contract('_StockupShareTokenReissued', function([owner, tokenholder, beneficiary, anyone]) {
  const NAME = 'CompanyShareToken';
  const SYMBOL = 'CST';

  beforeEach(async function() {
    this.token = await StockupShareToken.new(NAME, SYMBOL, { from: owner });

    this.value = new BN(10);

    await this.token.mint(tokenholder, this.value, { from: owner });
  });

  it('should reissue tokens by owner', async function() {
    await this.token.reissue(tokenholder, beneficiary, { from: owner });
  });

  it('requires non-zero to account', async function() {
    await shouldFail.reverting(this.token.reissue(tokenholder, ZERO_ADDRESS, { from: owner }));
  });

  it('reverts on reissue by anyone', async function() {
    await shouldFail.reverting(this.token.reissue(tokenholder, beneficiary, { from: anyone }));
  });

  context('when tokenholder account was frozen', function() {
    beforeEach(async function() {
      await this.token.freeze(tokenholder, { from: owner });
    });

    it('should reissue tokens', async function() {
      await this.token.reissue(tokenholder, beneficiary, { from: owner });
    });
  });

  context('when tokens reissued', function() {
    beforeEach(async function() {
      this.valueAdd = new BN(1);
      this.valueReissued = this.value.add(this.valueAdd);

      await this.token.mint(tokenholder, this.valueAdd, { from: owner });

      ({ logs: this.logs } = await this.token.reissue(tokenholder, beneficiary, { from: owner }));
    });

    it('should transfer reissued token from tokenholder account', async function() {
      (await this.token.balanceOf(tokenholder)).should.be.bignumber.equal(new BN(0));
    });

    it('should transfer reissued token to beneficiary account', async function() {
      (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(this.valueReissued);
    });

    it('should log reissue event', async function() {
      expectEvent.inLogs(this.logs, 'Reissue', {
        from: tokenholder,
        to: beneficiary,
        value: this.valueReissued,
      });
    });
  });
});
