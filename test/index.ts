import { expect } from "chai";
import { ethers } from "hardhat";
import { Greeter__factory } from "../typechain";

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const signers = await ethers.getSigners();
    console.log(Object.values(signers).map(el => el.address))
    const greeter = await new Greeter__factory(signers[0]).deploy("Hello, world!")
    console.log(greeter);
    
    expect(await greeter.greet()).to.eq("Hello, world!");

    await greeter.setGreeting("hola, mundo!");

    expect(await greeter.greet()).to.eq("hola, mundo!");
});
})
