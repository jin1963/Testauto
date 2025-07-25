let provider, signer, account, contract, usdt;

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    usdt = new ethers.Contract(usdtAddress, erc20ABI, signer);

    document.getElementById("walletAddress").innerText = `✅ ${account}`;
    document.getElementById("actionSection").style.display = "block";
    loadStakes();
  } else {
    alert("Please install MetaMask or Bitget Wallet.");
  }
}

async function registerReferrer() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get("ref");
  if (!ref || ref.toLowerCase() === account.toLowerCase()) {
    alert("❌ Invalid or missing referrer.");
    return;
  }

  try {
    const tx = await contract.registerReferrer(ref);
    await tx.wait();
    alert("✅ Referrer registered.");
  } catch (e) {
    alert("❌ Register failed.");
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || isNaN(amount)) return alert("❌ Enter valid USDT amount");
  const usdtAmount = ethers.utils.parseUnits(amount, 18);

  try {
    const allowance = await usdt.allowance(account, contractAddress);
    if (allowance.lt(usdtAmount)) {
      const tx1 = await usdt.approve(contractAddress, usdtAmount);
      await tx1.wait();
    }

    const tx2 = await contract.buyWithReferralAndStake(usdtAmount);
    await tx2.wait();
    alert("✅ Purchase & auto-stake successful!");
    loadStakes();
  } catch (e) {
    alert("❌ Transaction failed.");
  }
}

async function claimReferralReward() {
  try {
    const tx = await contract.claimReferralReward();
    await tx.wait();
    alert("✅ Referral reward claimed.");
  } catch (e) {
    alert("❌ Claim failed.");
  }
}

async function claimStakeReward(index) {
  try {
    const tx = await contract.claimStakeReward(index);
    await tx.wait();
    alert("✅ Stake reward claimed.");
  } catch (e) {
    alert("❌ Claim failed.");
  }
}

async function unstake(index) {
  try {
    const tx = await contract.unstake(index);
    await tx.wait();
    alert("✅ Unstaked.");
    loadStakes();
  } catch (e) {
    alert("❌ Unstake failed.");
  }
}

async function loadStakes() {
  const stakeList = document.getElementById("stakeList");
  stakeList.innerHTML = "";
  const count = await contract.getStakeCount(account);
  for (let i = 0; i < count; i++) {
    const stake = await contract.getStake(account, i);
    const claimedText = stake.claimed ? "✅" : "⏳";

    const div = document.createElement("div");
    div.innerHTML = `
      <p>
        #${i + 1}: ${ethers.utils.formatUnits(stake.amount, 18)} KJC 
        | Locked: ${new Date(stake.startTime * 1000).toLocaleDateString()} 
        | ${claimedText}
        <button onclick="claimStakeReward(${i})">Claim</button>
        <button onclick="unstake(${i})">Unstake</button>
      </p>
    `;
    stakeList.appendChild(div);
  }
}
