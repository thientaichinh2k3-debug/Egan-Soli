const hre = require("hardhat");

// Dung: npx hardhat run scripts/deploy.js [--network localhost]
// Doi ten hop dong qua bien moi truong CONTRACT, mac dinh la HelloWorld.
async function main() {
  const name = process.env.CONTRACT || "HelloWorld";
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Trien khai ${name} tu ${deployer.address}`);

  const contract = await hre.ethers.deployContract(name);
  await contract.waitForDeployment();
  console.log(`${name} da trien khai tai ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
