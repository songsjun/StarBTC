const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("ZkpOrder", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {

    // Contracts are deployed using the first signer/account by default
    const [owner, ownerUpgrade, user] = await ethers.getSigners();

    const rawData = "0x0100000001032e38e9c0a84c6046d687d10556dcacc41d275ec55fc00779ac88fdf357a187000000008c493046022100c352d3dd993a981beba4a63ad15c209275ca9470abfcd57da93b58e4eb5dce82022100840792bc1f456062819f15d33ee7055cf7b5ee1af1ebcc6028d9cdb1c3af7748014104f46db5e9d61a9dc27b8d64ad23e7383a4e6ca164593c2527c038c0857eb67ee8e825dca65046b82c9331586c82e0fd1f633f25f87c161bc6f8a630121df2b3d3ffffffff0200e32321000000001976a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac000fe208010000001976a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac00000000";
    const utxos = ["0x01000000012935b177236ec1cb75cd9fba86d84acac9d76ced9c1b22ba8de4cd2de85a8393000000004948304502200f653627aff050093a83dabc12a2a9b627041d424f2eb18849a2d587f1acd38f022100a23f94acd94a4d24049140d5fbe12448a880fd8f8c1c2b4141f83bef2be409be01ffffffff0100f2052a010000001976a91471d7dd96d9edda09180fe9d57a477b5acc9cad1188ac00000000"];
    const hash = "0xfff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4";//"0xc40297f730dd7b5a99567eb8d27b78758f607507c52292d02d4031895b52f2ff";
    const prover = "bc1qvlrsr9ya0f26nj30ywnmrptj056vskg3ah8g8c";
    const script = "0x6321020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7ad2102a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c51";

    const MockVerifier = await ethers.getContractFactory("MockStarkVerifier");
    const verifier = await MockVerifier.deploy();

    const ZkpOrder = await ethers.getContractFactory("ZkpOrder");
    const logic = await ZkpOrder.deploy();

    const data = logic.interface.encodeFunctionData("initialize", [verifier.address]);
    const TransparentProxy = await ethers.getContractFactory("ZkpOrderProxy");
    const proxy = await TransparentProxy.deploy(logic.address, ownerUpgrade.address, data);

    const order = await ethers.getContractAt("ZkpOrder", proxy.address);

    return { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user };
  }

  describe("addTransaction", function () {
    describe("Validations", function () {

      it("Should revert with only owner could rewrite", async function () {
        const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
          deployContracts
        );

        await expect(order.addTransaction(rawData, utxos, prover, script)).not.to.be.reverted;

        await expect(order.connect(user).addTransaction(rawData, utxos, prover, script)).to.be.revertedWith('only owner could rewrite');
      });

      it("Should revert with rewrite time must be greater than 30 minuts", async function () {
        const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
          deployContracts
        );

        await expect(order.addTransaction(rawData, utxos, prover, script)).not.to.be.reverted;

        await expect(order.addTransaction(rawData, utxos, prover, script)).to.be.revertedWith(
          "rewrite time must be greater than 30 minuts"
        );
      });

      it("Should rewrite successfully", async function () {
        const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
          deployContracts
        );

        await expect(order.addTransaction(rawData, utxos, prover, script)).not.to.be.reverted;

        await time.increase(2000);
        await expect(order.addTransaction(rawData, utxos, prover, script)).not.to.be.reverted;
      });

      it("Should get the data successfully", async function () {
        const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
          deployContracts
        );

        await order.addTransaction(rawData, utxos, prover, script);

        expect(await order.getOrderStatus(hash)).to.equal(0);
        expect(await order.getOrderData(hash)).to.equal(rawData);
        expect(await order.getOrderUtxos(hash)).to.deep.equal(utxos);
        expect(await order.getOwner(hash)).to.equal(owner.address);
      });
    });

    describe("Events", function () {
      it("Should emit an event on TransactionAdded", async function () {
        const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
          deployContracts
        );

        await expect(order.addTransaction(rawData, utxos, prover, script))
          .to.emit(order, "TransactionAdded")
          .withArgs(hash, rawData, utxos, prover, script); // We accept any value as `when` arg
      });
    });

  });

  describe("markTransactionVerified", function () {
    it("Should revert with not exist", async function () {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
        deployContracts
      );

      await expect(order.markTransactionVerified(hash)).to.be.revertedWith(
          "transaction does not exist"
        );
    });

    it("Should update transaction", async function () {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
        deployContracts
      );

      await order.addTransaction(rawData, utxos, prover, script);
      await order.markTransactionVerified(hash);

      expect(await order.getOrderStatus(hash)).to.equal(1);
    });
  });

  describe("upgrade", function () {
    it("should upgrade successfully", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
        deployContracts
      );

      const ZkpOrder = await ethers.getContractFactory("ZkpOrder");
      const logic = await ZkpOrder.deploy();

      const upgradeProxy = await ethers.getContractAt("ITransparentUpgradeableProxy", order.address);
      await upgradeProxy.connect(ownerUpgrade).upgradeTo(logic.address);

      expect(await upgradeProxy.connect(ownerUpgrade).implementation()).to.equal(logic.address);

    });

    it("should revert", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
        deployContracts
      );

      const ZkpOrder = await ethers.getContractFactory("ZkpOrder");
      const logic = await ZkpOrder.deploy();

      const upgradeProxy = await ethers.getContractAt("ITransparentUpgradeableProxy", order.address);

      await expect(upgradeProxy.connect(owner).upgradeToAndCall(logic.address, [])).to.be.reverted;
    });
  });

  describe("setVerifier", function () {
    it("should change verifier successfully", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash } = await loadFixture(
        deployContracts
      );

      const MockVerifier = await ethers.getContractFactory("MockStarkVerifier");
      const verifier = await MockVerifier.deploy();

      await order.connect(owner).setVerifier(verifier.address);

      expect(await order.verifier()).to.equal(verifier.address);

    });

    it("should revert with not owner", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
        deployContracts
      );

      const MockVerifier = await ethers.getContractFactory("MockStarkVerifier");
      const verifier = await MockVerifier.deploy();

      await expect(order.connect(user).setVerifier(verifier.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("transferOwner", function () {
    it("should transfer owner successfully", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
        deployContracts
      );

      await order.connect(owner).transferOwnership(user.address);

      expect(await order.pendingOwner()).to.equal(user.address);
      expect(await order.owner()).to.equal(owner.address);

      await order.connect(user).acceptOwnership();
      expect(await order.owner()).to.equal(user.address);
      expect(await order.pendingOwner()).to.equal(ethers.constants.AddressZero);

    });

    it("should revert with not owner", async function() {
      const { owner, ownerUpgrade, order, rawData, utxos, prover, script, hash, user } = await loadFixture(
        deployContracts
      );

      await expect(order.connect(user).transferOwnership(user.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

});
