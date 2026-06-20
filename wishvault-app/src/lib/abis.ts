export const WISH_REGISTRY_ABI = [
  "function createWish(string title,string description,string imageURI,uint256 goal,address recipient) returns (uint256 wishId)",
  "function donate(uint256 wishId,uint256 amount)",
  "function withdraw(uint256 wishId,uint256 amount)",
  "function closeWish(uint256 wishId)",
  "function getWish(uint256 wishId) view returns (tuple(address creator,address recipient,string title,string description,string imageURI,uint256 goal,uint256 totalRaised,uint256 balance,bool closed))",
  "function wishCount() view returns (uint256)",
  "event WishCreated(uint256 indexed wishId,address indexed creator,address indexed recipient,string title,string description,string imageURI,uint256 goal)",
  "event Donated(uint256 indexed wishId,address indexed donor,uint256 amount,uint256 totalRaised)",
  "event Withdrawn(uint256 indexed wishId,address indexed recipient,uint256 amount,uint256 remainingBalance)",
  "event WishClosed(uint256 indexed wishId)"
] as const;

export const ERC20_ABI = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
] as const;
