/* global artifacts contract describe context it beforeEach */
const { shouldFail, expectEvent, constants } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const IssuerOwnerRolesMock = artifacts.require('IssuerOwnerRolesMock');

contract('IssuerOwnerRoles', function([owner, issuer, newIssuer, anyone]) {
  it('requires non-null issuer account', async function() {
    await shouldFail.reverting(IssuerOwnerRolesMock.new(ZERO_ADDRESS, { from: owner }));
  });

  context('with deployed contract', function() {
    beforeEach(async function() {
      this.contract = await IssuerOwnerRolesMock.new(issuer, { from: owner });
    });

    it('should log initial setting issuer', async function() {
      expectEvent.inConstruction(this.contract, 'IssuerChanged', {
        previousIssuer: ZERO_ADDRESS,
        newIssuer: issuer,
      });
    });

    it('should set correct issuer account', async function() {
      (await this.contract.issuer()).should.be.equal(issuer);
    });

    it('should return correct issuer account status', async function() {
      (await this.contract.isIssuer({ from: issuer })).should.be.equal(true);
    });

    it('should deny access for anyone to restricted function (only issuer or owner)', async function() {
      await shouldFail.reverting(this.contract.onlyIssuerOrOwnerFunction({ from: anyone }));
    });

    it('should deny access for anyone to restricted function (only issuer)', async function() {
      await shouldFail.reverting(this.contract.onlyIssuerFunction({ from: anyone }));
      await shouldFail.reverting(this.contract.onlyIssuerFunction({ from: owner }));
    });

    it('should complete only issuer or owner restricted function', async function() {
      await this.contract.onlyIssuerOrOwnerFunction({ from: owner });
      await this.contract.onlyIssuerOrOwnerFunction({ from: issuer });
    });

    it('should complete only issuer restricted function', async function() {
      await this.contract.onlyIssuerFunction({ from: issuer });
    });

    describe('changing issuer', function() {
      it('requires non-null new issuer', async function() {
        await shouldFail.reverting(this.contract.changeIssuer(ZERO_ADDRESS, { from: owner }));
      });

      it('revert on changing issuer by current issuer', async function() {
        await shouldFail.reverting(this.contract.changeIssuer(newIssuer, { from: issuer }));
      });

      it('revert on changing issuer by anyone', async function() {
        await shouldFail.reverting(this.contract.changeIssuer(newIssuer, { from: anyone }));
      });

      it('should change issuer by owner', async function() {
        await this.contract.changeIssuer(newIssuer, { from: owner });
      });

      context('with new issuer', function() {
        beforeEach(async function() {
          ({ logs: this.logs } = await this.contract.changeIssuer(newIssuer, { from: owner }));
        });

        it('should change issuer correctly', async function() {
          (await this.contract.issuer()).should.be.equal(newIssuer);
          (await this.contract.isIssuer({ from: newIssuer })).should.be.equal(true);
        });

        it('should log changing issuer event', async function() {
          expectEvent.inLogs(this.logs, 'IssuerChanged', {
            previousIssuer: issuer,
            newIssuer,
          });
        });
      });
    });
  });
});
