const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelloWorld", function () {
  it("doc va ghi message", async function () {
    const hello = await ethers.deployContract("HelloWorld");
    expect(await hello.message()).to.equal("Hello, Solidity");
    await hello.setMessage("Egan");
    expect(await hello.message()).to.equal("Egan");
  });
});
