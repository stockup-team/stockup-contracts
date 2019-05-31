/* global artifacts contract describe context it beforeEach */
const { shouldFail, expectEvent, constants } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;

const TokenManagerRolesMock = artifacts.require('TokenManagerRolesMock');

contract('TokenManagerRoles', function([owner, admin, manager, newAdmin, newManager, anyone]) {
  it('requires non-null initial admin account', async function() {
    await shouldFail.reverting(TokenManagerRolesMock.new(ZERO_ADDRESS, { from: owner }));
  });

  context('with deployed contract', function() {
    beforeEach(async function() {
      this.contract = await TokenManagerRolesMock.new(admin, { from: owner });

      await this.contract.addManager(manager, { from: admin });
    });

    it('should log initial setting admin', async function() {
      expectEvent.inConstruction(this.contract, 'AdminAdded', {
        actor: ZERO_ADDRESS,
        account: admin,
      });
    });

    it('should return correct admin account status', async function() {
      (await this.contract.isAdmin(admin, { from: anyone })).should.be.equal(true);
    });

    it('should return correct manager account status', async function() {
      (await this.contract.isManager(manager, { from: anyone })).should.be.equal(true);
    });

    it('should deny access for anyone: only admin or manager or owner function', async function() {
      await shouldFail.reverting(this.contract.onlyAdminOrManagerOrOwnerFunction({ from: anyone }));
    });

    it('should deny access for anyone: only admin or owner function', async function() {
      await shouldFail.reverting(this.contract.onlyAdminOrOwnerFunction({ from: anyone }));
      await shouldFail.reverting(this.contract.onlyAdminOrOwnerFunction({ from: manager }));
    });

    it('should deny access for anyone: only admin function', async function() {
      await shouldFail.reverting(this.contract.onlyAdminFunction({ from: anyone }));
      await shouldFail.reverting(this.contract.onlyAdminFunction({ from: owner }));
      await shouldFail.reverting(this.contract.onlyAdminFunction({ from: manager }));
    });

    it('should complete: only admin or manager or owner function', async function() {
      await this.contract.onlyAdminOrManagerOrOwnerFunction({ from: admin });
      await this.contract.onlyAdminOrManagerOrOwnerFunction({ from: manager });
      await this.contract.onlyAdminOrManagerOrOwnerFunction({ from: owner });
    });

    it('should complete: only admin or owner function', async function() {
      await this.contract.onlyAdminOrOwnerFunction({ from: admin });
      await this.contract.onlyAdminOrOwnerFunction({ from: owner });
    });

    it('should complete: only admin function', async function() {
      await this.contract.onlyAdminFunction({ from: admin });
    });

    describe('add/remove admin', function() {
      it('revert on add admin by anyone, owner, manager', async function() {
        await shouldFail.reverting(this.contract.addAdmin(newAdmin, { from: anyone }));
        await shouldFail.reverting(this.contract.addAdmin(newAdmin, { from: owner }));
        await shouldFail.reverting(this.contract.addAdmin(newAdmin, { from: manager }));
      });

      it('should add new admin by admin', async function() {
        await this.contract.addAdmin(newAdmin, { from: admin });
        (await this.contract.isAdmin(newAdmin, { from: anyone })).should.be.equal(true);
      });

      context('with added admin', function() {
        beforeEach(async function() {
          ({ logs: this.logs } = await this.contract.addAdmin(newAdmin, { from: admin }));
        });

        it('should log add admin event', async function() {
          expectEvent.inLogs(this.logs, 'AdminAdded', {
            actor: admin,
            account: newAdmin,
          });
        });

        it('revert on remove admin by current admin', async function() {
          await shouldFail.reverting(this.contract.removeAdmin(admin, { from: admin }));
          await shouldFail.reverting(this.contract.removeAdmin(newAdmin, { from: newAdmin }));
        });

        it('revert on remove admin by anyone, owner, manager', async function() {
          await shouldFail.reverting(this.contract.removeAdmin(newAdmin, { from: anyone }));
          await shouldFail.reverting(this.contract.removeAdmin(newAdmin, { from: owner }));
          await shouldFail.reverting(this.contract.removeAdmin(newAdmin, { from: manager }));
        });

        it('should remove new admin by admin', async function() {
          await this.contract.removeAdmin(newAdmin, { from: admin });
          (await this.contract.isAdmin(newAdmin, { from: anyone })).should.be.equal(false);
        });

        context('with removed admin', function() {
          beforeEach(async function() {
            ({ logs: this.logs } = await this.contract.removeAdmin(newAdmin, { from: admin }));
          });

          it('should log remove admin event', async function() {
            expectEvent.inLogs(this.logs, 'AdminRemoved', {
              actor: admin,
              account: newAdmin,
            });
          });
        });
      });
    });

    describe('add/remove manager', function() {
      it('revert on add manager by anyone, owner, manager', async function() {
        await shouldFail.reverting(this.contract.addManager(newManager, { from: anyone }));
        await shouldFail.reverting(this.contract.addManager(newManager, { from: owner }));
        await shouldFail.reverting(this.contract.addManager(newManager, { from: manager }));
      });

      it('should add new manager by admin', async function() {
        await this.contract.addManager(newManager, { from: admin });
        (await this.contract.isManager(newManager, { from: anyone })).should.be.equal(true);
      });

      context('with added manager', function() {
        beforeEach(async function() {
          ({ logs: this.logs } = await this.contract.addManager(newManager, { from: admin }));
        });

        it('should log add manager event', async function() {
          expectEvent.inLogs(this.logs, 'ManagerAdded', {
            actor: admin,
            account: newManager,
          });
        });

        it('revert on remove manager by anyone, owner, manager', async function() {
          await shouldFail.reverting(this.contract.removeManager(newManager, { from: anyone }));
          await shouldFail.reverting(this.contract.removeManager(newManager, { from: owner }));
          await shouldFail.reverting(this.contract.removeManager(newManager, { from: manager }));
        });

        it('should remove new manager by admin', async function() {
          await this.contract.removeManager(newManager, { from: admin });
          (await this.contract.isManager(newManager, { from: anyone })).should.be.equal(false);
        });

        context('with removed manager', function() {
          beforeEach(async function() {
            ({ logs: this.logs } = await this.contract.removeManager(newManager, { from: admin }));
          });

          it('should log remove admin event', async function() {
            expectEvent.inLogs(this.logs, 'ManagerRemoved', {
              actor: admin,
              account: newManager,
            });
          });
        });
      });
    });
  });
});
