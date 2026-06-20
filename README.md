# ArcWish

ArcWish is a non-custodial Arc Testnet wish registry. Users register a public wish with a USDC goal, donors help fund it directly, and the recipient can collect available funds at any time.

The project includes a React frontend, a Solidity registry contract, IPFS image uploads through Pinata, and an Arc Testnet wallet guard.

## Live App

Local build is ready. Add the deployed frontend URL here after hosting.

## Network

| Setting | Value |
| --- | --- |
| Network | Arc Testnet |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Native symbol | `USDC` |
| Explorer | `https://testnet.arcscan.app` |

## Deployed Contracts

| Contract | Address |
| --- | --- |
| WishRegistry | `0x582478504266E514e681a9886bCa08e9DCDb049c` |
| Arc Testnet USDC | `0x3600000000000000000000000000000000000000` |

## Wish Registry

[`WishRegistry.sol`](wishvault-contracts/src/WishRegistry.sol) stores one list of wishes on Arc Testnet.

Each wish contains:

- creator and recipient addresses
- title, description, and image URI
- optional USDC goal
- total raised amount
- collectable balance
- closed/open status

The contract supports:

- `createWish` for registering a wish
- `donate` for funding a wish with USDC
- `withdraw` for recipient collection
- `closeWish` for creator-controlled closure
- `getWish` and `wishCount` for frontend reads

Donations are final once confirmed on Arc Testnet. Existing balances can still be collected after a wish is closed.

## Frontend

The frontend lives in [`wishvault-app`](wishvault-app).

It provides:

- Arc Testnet wallet connection and network switching
- public Explore catalog
- Create flow with Pinata/IPFS image upload
- avatar focal-point controls for uploaded wish images
- wish detail pages with donate and collect panels
- Dashboard tabs for planted and watered wishes
- Activity feed derived from Arc event logs
- USDC approval and donate flow
- responsive botanical specimen UI

The public catalog intentionally hides wishes without a real uploaded avatar/image. Placeholder records such as `ipfs://none`, `none`, or empty image URIs are filtered out before rendering.

## Image Uploads

Uploaded images are pinned through Pinata and stored as `ipfs://` CIDs. The frontend resolves them through a configured Pinata gateway when present, then falls back to public IPFS gateways.

The image focal point is stored in the image URI as query metadata:

```text
ipfs://CID?focusX=50&focusY=50
```

This keeps the existing contract unchanged while allowing cards, detail pages, and dashboard views to crop the same image consistently.

## Local Development

Contracts:

```powershell
cd wishvault-contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test
```

Frontend:

```powershell
cd wishvault-app
npm.cmd install
npm.cmd run dev
```

Create `wishvault-app/.env`:

```env
VITE_WISH_REGISTRY_ADDRESS=0x582478504266E514e681a9886bCa08e9DCDb049c
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY=your_gateway_url
```

Never commit `.env` or expose a Pinata JWT.

## Testing the App

1. Add Arc Testnet to MetaMask.
2. Get testnet USDC from the Circle Faucet.
3. Start the frontend.
4. Connect your wallet.
5. Register a wish with an uploaded image.
6. Use the crop controls to choose which part of the image appears on cards and dashboard.
7. Open the wish detail page.
8. Approve USDC, then donate.
9. Connect as the recipient and collect funds.

## Project Structure

```text
README.md
wishvault-app/
  src/
    components/
    pages/
    lib/
wishvault-contracts/
  src/
    WishRegistry.sol
  script/
    Deploy.s.sol
  test/
    WishRegistry.t.sol
.github/
  workflows/
    contracts-ci.yml
```

## Stack

- Solidity 0.8.24
- Foundry
- OpenZeppelin Contracts
- Vite
- React 18
- TypeScript
- Tailwind CSS
- ethers.js v6
- Framer Motion
- GSAP
- Pinata/IPFS
- Arc Testnet
