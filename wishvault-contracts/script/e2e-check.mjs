import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "../../wishvault-app/node_modules/ethers/lib.esm/index.js";

const RPC_URL = "https://rpc.testnet.arc.network";
const EXPLORER = "https://testnet.arcscan.app";
const REGISTRY_ADDRESS = "0x582478504266E514e681a9886bCa08e9DCDb049c";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const DONATION_AMOUNT = 2_000_000n;
const WITHDRAW_AMOUNT = 1_000_000n;
const GOAL = 5_000_000n;
const OTHER_RECIPIENT = "0x000000000000000000000000000000000000dEaD";

const registryAbi = [
  "event WishCreated(uint256 indexed wishId, address indexed creator, address indexed recipient, string title, string description, string imageURI, uint256 goal)",
  "event Donated(uint256 indexed wishId, address indexed donor, uint256 amount, uint256 totalRaised)",
  "event Withdrawn(uint256 indexed wishId, address indexed recipient, uint256 amount, uint256 remainingBalance)",
  "error NotRecipient()",
  "function createWish(string title, string description, string imageURI, uint256 goal, address recipient) returns (uint256)",
  "function donate(uint256 wishId, uint256 amount)",
  "function withdraw(uint256 wishId, uint256 amount)",
  "function getWish(uint256 wishId) view returns (tuple(address creator,address recipient,string title,string description,string imageURI,uint256 goal,uint256 totalRaised,uint256 balance,bool closed))",
  "function wishCount() view returns (uint256)"
];

const usdcAbi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

function readPrivateKey() {
  const envPath = resolve(process.cwd(), ".env");
  const env = readFileSync(envPath, "utf8");
  const match = env.match(/^PRIVATE_KEY\s*=\s*(0x[0-9a-fA-F]{64})\s*$/m);
  if (!match) throw new Error(`PRIVATE_KEY missing or invalid in ${envPath}`);
  return match[1];
}

function txUrl(hash) {
  return `${EXPLORER}/tx/${hash}`;
}

function addressUrl(address) {
  return `${EXPLORER}/address/${address}`;
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected.toString()}, got ${actual.toString()}`);
  }
}

function parseFirstEvent(receipt, iface, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === eventName) return parsed;
    } catch {
      // Ignore logs from other contracts.
    }
  }
  throw new Error(`${eventName} not found in receipt ${receipt.hash}`);
}

function printStep(step, lines = []) {
  console.log(`\nSTEP ${step}`);
  for (const line of lines) console.log(line);
}

async function waitSuccess(tx, label) {
  console.log(`${label} tx: ${tx.hash}`);
  console.log(`${label} arcscan: ${txUrl(tx.hash)}`);
  const receipt = await tx.wait();
  console.log(`${label} status: ${receipt.status === 1 ? "success" : "failed"}`);
  if (receipt.status !== 1) throw new Error(`${label} transaction failed: ${tx.hash}`);
  return receipt;
}

const provider = new ethers.JsonRpcProvider(RPC_URL, 5042002);
const wallet = new ethers.Wallet(readPrivateKey(), provider);
const registry = new ethers.Contract(REGISTRY_ADDRESS, registryAbi, wallet);
const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, wallet);
const registryIface = new ethers.Interface(registryAbi);
const deployer = await wallet.getAddress();

console.log(`Registry: ${REGISTRY_ADDRESS}`);
console.log(`Registry Arcscan: ${addressUrl(REGISTRY_ADDRESS)}`);
console.log(`USDC: ${USDC_ADDRESS}`);
console.log(`Deployer: ${deployer}`);

const baselineCount = await registry.wishCount();
printStep("1 PASS", [`wishCount baseline: ${baselineCount.toString()}`]);

printStep("2", ["Creating E2E test wish"]);
const createTx = await registry.createWish("E2E test wish", "Throwaway live verification wish.", "", GOAL, deployer);
const createReceipt = await waitSuccess(createTx, "createWish");
const created = parseFirstEvent(createReceipt, registryIface, "WishCreated");
const wishId = created.args.wishId;
console.log(`WishCreated wishId: ${wishId.toString()}`);
console.log(`WishCreated goal: ${created.args.goal.toString()}`);
printStep("2 PASS", [`tx hash: ${createTx.hash}`, `arcscan: ${txUrl(createTx.hash)}`, `wishId: ${wishId.toString()}`]);

const afterCreate = await registry.getWish(wishId);
printStep("3", [
  `goal: ${afterCreate.goal.toString()}`,
  `totalRaised: ${afterCreate.totalRaised.toString()}`,
  `balance: ${afterCreate.balance.toString()}`
]);
assertEq(afterCreate.goal, GOAL, "created goal");
assertEq(afterCreate.totalRaised, 0n, "created totalRaised");
assertEq(afterCreate.balance, 0n, "created balance");
printStep("3 PASS", [`read getWish(${wishId.toString()}) matches create write`]);

const usdcBalance = await usdc.balanceOf(deployer);
if (usdcBalance < DONATION_AMOUNT) {
  throw new Error(`deployer ERC20 USDC balance too low: need ${DONATION_AMOUNT.toString()}, have ${usdcBalance.toString()}`);
}
printStep("4", [`Approving ${DONATION_AMOUNT.toString()} USDC units`]);
const approveTx = await usdc.approve(REGISTRY_ADDRESS, DONATION_AMOUNT);
const approveReceipt = await waitSuccess(approveTx, "approve");
const allowance = await usdc.allowance(deployer, REGISTRY_ADDRESS);
console.log(`allowance after approve: ${allowance.toString()}`);
assertEq(allowance, DONATION_AMOUNT, "allowance");
printStep("4 PASS", [`tx hash: ${approveTx.hash}`, `arcscan: ${txUrl(approveTx.hash)}`, `allowance: ${allowance.toString()}`]);

printStep("5", [`Donating ${DONATION_AMOUNT.toString()} to wish ${wishId.toString()}`]);
const donateTx = await registry.donate(wishId, DONATION_AMOUNT);
const donateReceipt = await waitSuccess(donateTx, "donate");
const donated = parseFirstEvent(donateReceipt, registryIface, "Donated");
console.log(`Donated amount: ${donated.args.amount.toString()}`);
console.log(`Donated totalRaised: ${donated.args.totalRaised.toString()}`);
assertEq(donated.args.amount, DONATION_AMOUNT, "Donated.amount");
assertEq(donated.args.totalRaised, DONATION_AMOUNT, "Donated.totalRaised");
printStep("5 PASS", [`tx hash: ${donateTx.hash}`, `arcscan: ${txUrl(donateTx.hash)}`]);

const afterDonate = await registry.getWish(wishId);
printStep("6", [`totalRaised: ${afterDonate.totalRaised.toString()}`, `balance: ${afterDonate.balance.toString()}`]);
assertEq(afterDonate.totalRaised, DONATION_AMOUNT, "post-donate totalRaised");
assertEq(afterDonate.balance, DONATION_AMOUNT, "post-donate balance");
printStep("6 PASS", [`getWish(${wishId.toString()}) totalRaised and balance both equal ${DONATION_AMOUNT.toString()}`]);

printStep("7", [`Withdrawing ${WITHDRAW_AMOUNT.toString()} from wish ${wishId.toString()}`]);
const withdrawOneTx = await registry.withdraw(wishId, WITHDRAW_AMOUNT);
const withdrawOneReceipt = await waitSuccess(withdrawOneTx, "withdraw partial");
const withdrawnOne = parseFirstEvent(withdrawOneReceipt, registryIface, "Withdrawn");
console.log(`Withdrawn amount: ${withdrawnOne.args.amount.toString()}`);
console.log(`Withdrawn remainingBalance: ${withdrawnOne.args.remainingBalance.toString()}`);
assertEq(withdrawnOne.args.amount, WITHDRAW_AMOUNT, "Withdrawn.amount partial");
assertEq(withdrawnOne.args.remainingBalance, WITHDRAW_AMOUNT, "Withdrawn.remainingBalance partial");
printStep("7 PASS", [`tx hash: ${withdrawOneTx.hash}`, `arcscan: ${txUrl(withdrawOneTx.hash)}`]);

const afterWithdrawOne = await registry.getWish(wishId);
printStep("8", [
  `totalRaised: ${afterWithdrawOne.totalRaised.toString()}`,
  `balance: ${afterWithdrawOne.balance.toString()}`
]);
assertEq(afterWithdrawOne.totalRaised, DONATION_AMOUNT, "post-partial-withdraw totalRaised");
assertEq(afterWithdrawOne.balance, WITHDRAW_AMOUNT, "post-partial-withdraw balance");
printStep("8 PASS", [`balance is ${WITHDRAW_AMOUNT.toString()} and totalRaised remains ${DONATION_AMOUNT.toString()}`]);

printStep("9", [`Withdrawing remaining ${WITHDRAW_AMOUNT.toString()} from wish ${wishId.toString()}`]);
const withdrawTwoTx = await registry.withdraw(wishId, WITHDRAW_AMOUNT);
const withdrawTwoReceipt = await waitSuccess(withdrawTwoTx, "withdraw remaining");
const withdrawnTwo = parseFirstEvent(withdrawTwoReceipt, registryIface, "Withdrawn");
const afterWithdrawTwo = await registry.getWish(wishId);
console.log(`Withdrawn amount: ${withdrawnTwo.args.amount.toString()}`);
console.log(`Withdrawn remainingBalance: ${withdrawnTwo.args.remainingBalance.toString()}`);
console.log(`totalRaised after final withdraw: ${afterWithdrawTwo.totalRaised.toString()}`);
console.log(`balance after final withdraw: ${afterWithdrawTwo.balance.toString()}`);
assertEq(withdrawnTwo.args.amount, WITHDRAW_AMOUNT, "Withdrawn.amount final");
assertEq(withdrawnTwo.args.remainingBalance, 0n, "Withdrawn.remainingBalance final");
assertEq(afterWithdrawTwo.totalRaised, DONATION_AMOUNT, "post-final-withdraw totalRaised");
assertEq(afterWithdrawTwo.balance, 0n, "post-final-withdraw balance");
printStep("9 PASS", [`tx hash: ${withdrawTwoTx.hash}`, `arcscan: ${txUrl(withdrawTwoTx.hash)}`]);

printStep("10", [`Creating access-control wish with recipient ${OTHER_RECIPIENT}`]);
const accessCreateTx = await registry.createWish("E2E access-control wish", "Throwaway live revert verification wish.", "", GOAL, OTHER_RECIPIENT);
const accessCreateReceipt = await waitSuccess(accessCreateTx, "create access-control wish");
const accessCreated = parseFirstEvent(accessCreateReceipt, registryIface, "WishCreated");
const accessWishId = accessCreated.args.wishId;
console.log(`Access-control wishId: ${accessWishId.toString()}`);

try {
  await registry.withdraw.staticCall(accessWishId, 1n);
  throw new Error("withdraw staticCall unexpectedly succeeded for non-recipient");
} catch (error) {
  if (error?.data) {
    const parsed = registryIface.parseError(error.data);
    if (parsed?.name !== "NotRecipient") throw new Error(`expected NotRecipient revert, got ${parsed?.name ?? error.shortMessage ?? error.message}`);
    console.log(`staticCall revert: ${parsed.name}`);
  } else {
    throw new Error(`expected NotRecipient revert data, got: ${error?.shortMessage ?? error?.message ?? error}`);
  }
}

const revertData = registry.interface.encodeFunctionData("withdraw", [accessWishId, 1n]);
const revertTx = await wallet.sendTransaction({
  to: REGISTRY_ADDRESS,
  data: revertData,
  gasLimit: 200_000n
});
console.log(`forced non-recipient withdraw tx: ${revertTx.hash}`);
console.log(`forced non-recipient withdraw arcscan: ${txUrl(revertTx.hash)}`);

let revertReceipt;
try {
  revertReceipt = await revertTx.wait();
} catch (error) {
  revertReceipt = error?.receipt;
}
if (!revertReceipt) throw new Error(`missing receipt for forced revert transaction ${revertTx.hash}`);
console.log(`forced non-recipient withdraw status: ${revertReceipt.status === 0 ? "reverted" : "success"}`);
if (revertReceipt.status !== 0) throw new Error(`non-recipient withdraw unexpectedly succeeded: ${revertTx.hash}`);
printStep("10 PASS", [
  `setup tx hash: ${accessCreateTx.hash}`,
  `setup arcscan: ${txUrl(accessCreateTx.hash)}`,
  `revert tx hash: ${revertTx.hash}`,
  `revert arcscan: ${txUrl(revertTx.hash)}`,
  "expected revert: NotRecipient"
]);

console.log("\nALL E2E CHECKS PASSED");
