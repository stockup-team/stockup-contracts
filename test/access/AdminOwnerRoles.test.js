/* global artifacts contract describe context it beforeEach */
const { shouldFail, expectEvent, constants } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const AdminOwnerRolesMock = artifacts.require('AdminOwnerRolesMock');

contract('AdminOwnerRoles', function([owner, admin, newAdmin, anyone]) {
  beforeEach(async function() {
    this.contract = await AdminOwnerRolesMock.new({ from: owner });
  });

  it('should initialize owner as admin account', async function() {
    (await this.contract.admin()).should.be.equal(owner);
  });

  it('should log initial set admin', async function() {
    expectEvent.inConstruction(this.contract, 'AdminChanged', {
      previousAdmin: ZERO_ADDRESS,
      newAdmin: owner,
    });
  });

  it('should return correct admin account status', async function() {
    (await this.contract.isAdmin({ from: owner })).should.be.equal(true);
  });

  context('with new admin non-equal owner', function() {
    beforeEach(async function() {
      ({ logs: this.logs } = await this.contract.changeAdmin(admin, { from: owner }));
    });

    it('should change admin correctly', async function() {
      (await this.contract.admin()).should.be.equal(admin);
      (await this.contract.isAdmin({ from: admin })).should.be.equal(true);
    });

    it('should log changing admin event', async function() {
      expectEvent.inLogs(this.logs, 'AdminChanged', {
        previousAdmin: owner,
        newAdmin: admin,
      });
    });

    it('should deny access for anyone to restricted function (only admin or owner)', async function() {
      await shouldFail.reverting(this.contract.onlyAdminOrOwnerFunction({ from: anyone }));
    });

    it('should deny access for anyone to restricted function (only admin)', async function() {
      await shouldFail.reverting(this.contract.onlyAdminFunction({ from: anyone }));
      await shouldFail.reverting(this.contract.onlyAdminFunction({ from: owner }));
    });

    it('should complete only admin or owner restricted function', async function() {
      await this.contract.onlyAdminOrOwnerFunction({ from: owner });
      await this.contract.onlyAdminOrOwnerFunction({ from: admin });
    });

    it('should complete only admin restricted function', async function() {
      await this.contract.onlyAdminFunction({ from: admin });
    });

    describe('change admin function', function() {
      it('requires non-null new admin', async function() {
        await shouldFail.reverting(this.contract.changeAdmin(ZERO_ADDRESS, { from: owner }));
      });

      it('revert on changing admin by current admin', async function() {
        await shouldFail.reverting(this.contract.changeAdmin(newAdmin, { from: admin }));
      });

      it('revert on changing admin by anyone', async function() {
        await shouldFail.reverting(this.contract.changeAdmin(newAdmin, { from: anyone }));
      });

      it('should change admin by owner', async function() {
        await this.contract.changeAdmin(newAdmin, { from: owner });
      });
    });
  });
});
