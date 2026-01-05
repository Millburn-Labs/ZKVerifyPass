import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ZKVerifyPass", function () {
  let verifier: Contract;
  let registry: Contract;
  let zkVerifyPass: Contract;
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;

  const verificationFee = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();

    // Deploy Verifier (template - in production, use generated verifier)
    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();

    // Deploy VerificationRegistry
    const VerificationRegistry = await ethers.getContractFactory("VerificationRegistry");
    registry = await VerificationRegistry.deploy();

    // Deploy ZKVerifyPass
    const ZKVerifyPass = await ethers.getContractFactory("ZKVerifyPass");
    zkVerifyPass = await ZKVerifyPass.deploy(
      await verifier.getAddress(),
      await registry.getAddress(),
      verificationFee
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await zkVerifyPass.owner()).to.equal(ownerAddress);
    });

    it("Should set the correct verification fee", async function () {
      expect(await zkVerifyPass.verificationFee()).to.equal(verificationFee);
    });

    it("Should set verifier and registry addresses", async function () {
      expect(await zkVerifyPass.verifier()).to.equal(await verifier.getAddress());
      expect(await zkVerifyPass.registry()).to.equal(await registry.getAddress());
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update fee", async function () {
      const newFee = ethers.parseEther("0.002");
      await zkVerifyPass.connect(owner).setVerificationFee(newFee);
      expect(await zkVerifyPass.verificationFee()).to.equal(newFee);
    });

    it("Should not allow non-owner to update fee", async function () {
      const newFee = ethers.parseEther("0.002");
      await expect(
        zkVerifyPass.connect(user).setVerificationFee(newFee)
      ).to.be.revertedWith("Only owner can set fee");
    });

    it("Should emit FeeUpdated event", async function () {
      const newFee = ethers.parseEther("0.002");
      await expect(zkVerifyPass.connect(owner).setVerificationFee(newFee))
        .to.emit(zkVerifyPass, "FeeUpdated")
        .withArgs(verificationFee, newFee);
    });
  });

  describe("Verification", function () {
    it("Should reject verification with insufficient fee", async function () {
      const proof = {
        a: [ethers.parseUnits("1", 0), ethers.parseUnits("2", 0)],
        b: [
          [ethers.parseUnits("3", 0), ethers.parseUnits("4", 0)],
          [ethers.parseUnits("5", 0), ethers.parseUnits("6", 0)]
        ],
        c: [ethers.parseUnits("7", 0), ethers.parseUnits("8", 0)]
      };
      const publicInputs = [ethers.parseUnits("9", 0), ethers.parseUnits("10", 0)];

      await expect(
        zkVerifyPass.connect(user).verifyAndRecord(
          proof,
          publicInputs,
          ethers.ZeroAddress,
          "test",
          { value: verificationFee - 1n }
        )
      ).to.be.revertedWith("Insufficient verification fee");
    });

    it("Should reject verification with wrong public inputs length", async function () {
      const proof = {
        a: [ethers.parseUnits("1", 0), ethers.parseUnits("2", 0)],
        b: [
          [ethers.parseUnits("3", 0), ethers.parseUnits("4", 0)],
          [ethers.parseUnits("5", 0), ethers.parseUnits("6", 0)]
        ],
        c: [ethers.parseUnits("7", 0), ethers.parseUnits("8", 0)]
      };
      const publicInputs = [ethers.parseUnits("9", 0)]; // Wrong length

      await expect(
        zkVerifyPass.connect(user).verifyAndRecord(
          proof,
          publicInputs,
          ethers.ZeroAddress,
          "test",
          { value: verificationFee }
        )
      ).to.be.revertedWith("Invalid public inputs length");
    });

    it("Should refund excess payment", async function () {
      const proof = {
        a: [ethers.parseUnits("1", 0), ethers.parseUnits("2", 0)],
        b: [
          [ethers.parseUnits("3", 0), ethers.parseUnits("4", 0)],
          [ethers.parseUnits("5", 0), ethers.parseUnits("6", 0)]
        ],
        c: [ethers.parseUnits("7", 0), ethers.parseUnits("8", 0)]
      };
      const publicInputs = [ethers.parseUnits("9", 0), ethers.parseUnits("10", 0)];
      const excessAmount = ethers.parseEther("0.001");
      const totalAmount = verificationFee + excessAmount;

      const initialBalance = await ethers.provider.getBalance(userAddress);
      
      const tx = await zkVerifyPass.connect(user).verifyAndRecord(
        proof,
        publicInputs,
        ethers.ZeroAddress,
        "test",
        { value: totalAmount }
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const finalBalance = await ethers.provider.getBalance(userAddress);

      // User should have paid fee + gas, and received excess back
      expect(initialBalance - finalBalance).to.be.closeTo(
        verificationFee + gasUsed,
        ethers.parseEther("0.0001")
      );
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await zkVerifyPass.connect(owner).transferOwnership(userAddress);
      expect(await zkVerifyPass.owner()).to.equal(userAddress);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        zkVerifyPass.connect(user).transferOwnership(userAddress)
      ).to.be.revertedWith("Only owner can transfer");
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(zkVerifyPass.connect(owner).transferOwnership(userAddress))
        .to.emit(zkVerifyPass, "OwnershipTransferred")
        .withArgs(ownerAddress, userAddress);
    });
  });

  describe("Withdrawal", function () {
    it("Should allow owner to withdraw", async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: await zkVerifyPass.getAddress(),
        value: ethers.parseEther("1")
      });

      const initialBalance = await ethers.provider.getBalance(ownerAddress);
      const contractBalance = await ethers.provider.getBalance(await zkVerifyPass.getAddress());

      const tx = await zkVerifyPass.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(ownerAddress);
      const finalContractBalance = await ethers.provider.getBalance(await zkVerifyPass.getAddress());

      expect(finalContractBalance).to.equal(0);
      expect(finalBalance - initialBalance).to.be.closeTo(
        contractBalance - gasUsed,
        ethers.parseEther("0.0001")
      );
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        zkVerifyPass.connect(user).withdraw()
      ).to.be.revertedWith("Only owner can withdraw");
    });
  });
});

describe("VerificationRegistry", function () {
  let registry: Contract;
  let owner: Signer;
  let verifier: Signer;
  let subject: Signer;
  let ownerAddress: string;
  let verifierAddress: string;
  let subjectAddress: string;

  beforeEach(async function () {
    [owner, verifier, subject] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    verifierAddress = await verifier.getAddress();
    subjectAddress = await subject.getAddress();

    const VerificationRegistry = await ethers.getContractFactory("VerificationRegistry");
    registry = await VerificationRegistry.deploy();
  });

  describe("Recording Verifications", function () {
    it("Should record a new verification", async function () {
      const verificationId = ethers.id("test-verification-1");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test verification"
      );

      const record = await registry.getVerification(verificationId);
      expect(record.verifier).to.equal(verifierAddress);
      expect(record.subject).to.equal(subjectAddress);
      expect(record.isValid).to.be.true;
      expect(record.metadata).to.equal("Test verification");
    });

    it("Should not allow duplicate verification IDs", async function () {
      const verificationId = ethers.id("test-verification-1");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test verification"
      );

      await expect(
        registry.recordVerification(
          verificationId,
          verifierAddress,
          subjectAddress,
          true,
          publicInputHash,
          "Duplicate"
        )
      ).to.be.revertedWith("Verification ID already exists");
    });

    it("Should emit VerificationRecorded event", async function () {
      const verificationId = ethers.id("test-verification-1");
      const publicInputHash = ethers.id("public-inputs");

      await expect(
        registry.recordVerification(
          verificationId,
          verifierAddress,
          subjectAddress,
          true,
          publicInputHash,
          "Test verification"
        )
      )
        .to.emit(registry, "VerificationRecorded")
        .withArgs(verificationId, verifierAddress, subjectAddress, anyValue, true);
    });
  });

  describe("Querying Verifications", function () {
    it("Should return verification by ID", async function () {
      const verificationId = ethers.id("test-verification-1");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test verification"
      );

      const record = await registry.getVerification(verificationId);
      expect(record.verificationId).to.equal(verificationId);
    });

    it("Should return all verifications for a subject", async function () {
      const verificationId1 = ethers.id("test-1");
      const verificationId2 = ethers.id("test-2");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId1,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test 1"
      );

      await registry.recordVerification(
        verificationId2,
        verifierAddress,
        subjectAddress,
        false,
        publicInputHash,
        "Test 2"
      );

      const verifications = await registry.getSubjectVerifications(subjectAddress);
      expect(verifications.length).to.equal(2);
      expect(verifications[0]).to.equal(verificationId1);
      expect(verifications[1]).to.equal(verificationId2);
    });

    it("Should return all verifications by a verifier", async function () {
      const verificationId1 = ethers.id("test-1");
      const verificationId2 = ethers.id("test-2");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId1,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test 1"
      );

      const [anotherSubject] = await ethers.getSigners();
      await registry.recordVerification(
        verificationId2,
        verifierAddress,
        await anotherSubject.getAddress(),
        false,
        publicInputHash,
        "Test 2"
      );

      const verifications = await registry.getVerifierRecords(verifierAddress);
      expect(verifications.length).to.equal(2);
    });

    it("Should check verification status correctly", async function () {
      const verificationId = ethers.id("test-verification-1");
      const publicInputHash = ethers.id("public-inputs");

      await registry.recordVerification(
        verificationId,
        verifierAddress,
        subjectAddress,
        true,
        publicInputHash,
        "Test verification"
      );

      const [exists, isValid] = await registry.checkVerification(verificationId);
      expect(exists).to.be.true;
      expect(isValid).to.be.true;

      const [exists2, isValid2] = await registry.checkVerification(ethers.id("non-existent"));
      expect(exists2).to.be.false;
      expect(isValid2).to.be.false;
    });
  });
});

// Helper for event matching
function anyValue() {
  return true;
}


