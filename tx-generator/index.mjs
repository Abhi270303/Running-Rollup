import { ethers } from "ethers";
(async () => {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8547'); // Rollup RPC URL
    const signer = new ethers.Wallet('aed54304c2633a25b91f219e62b6e2bfc7d73631230e1acc04f21c1ad60d8140', provider);

    const tx = await signer.sendTransaction({
        to: '0xc6377415Ee98A7b71161Ee963603eE52fF7750FC',
        value: ethers.parseUnits('1', 'wei'),
        gasPrice: ethers.parseUnits('1', 'gwei'),
        gasLimit: 26000,
    });
    console.log(tx);
})();
