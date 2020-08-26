import React from "react";
import { Contract, providers, utils } from "ethers";
import Web3Modal, { getChainId } from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

// @ts-ignore
import logo from "./logo.svg";
import "./App.css";

function formatEtherscanTxUrl(network: string, txHash?: string) {
  const subdomain = network === "mainnet" ? "" : `${network}.`;
  return `https://${subdomain}etherscan.io/tx/${txHash}`;
}

const tokenAbi = [
  "function mint(address _to, uint256 _value) returns (bool success)",
  "function transfer(address _to, uint256 _value) returns (bool success)",
  "function balanceOf(address account) view returns (uint256)",
];

function App() {
  const mintAmount = process.env.REACT_APP_MINT_AMOUNT || "10";
  const tokenAddress =
    process.env.REACT_APP_TOKEN_ADDRESS ||
    "0x50C94BeCAd95bEe21aF226dc799365Ee6B134459";
  const targetNetwork = process.env.REACT_APP_TARGET_NETWORK || "rinkeby";
  const targetChainId = getChainId(targetNetwork);
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: process.env.REACT_APP_INFURA_ID,
      },
    },
  };
  const web3Modal = new Web3Modal({
    network: targetNetwork,
    cacheProvider: true,
    providerOptions,
  });

  const [txHash, setTxHash] = React.useState<string>();
  const [chainId, setChainId] = React.useState<number>();
  const [address, setAddress] = React.useState<string>();
  const [provider, setProvider] = React.useState<providers.Web3Provider>();

  async function connect() {
    const web3Provider = await web3Modal.connect();
    const provider = new providers.Web3Provider(web3Provider);
    const networkContext = await provider.getNetwork();
    setChainId(networkContext.chainId);
    provider.on("chainChanged", (_chainId: number) => {
      setChainId(_chainId);
    });
    setProvider(provider);
  }

  async function mint() {
    if (typeof provider === "undefined") {
      throw new Error("Provider is undefined");
    }
    if (typeof tokenAddress === "undefined") {
      throw new Error("Token address is undefined");
    }
    const token = new Contract(tokenAddress, tokenAbi, provider.getSigner());
    const tx = await token.mint(address, utils.parseEther(mintAmount));
    setTxHash(tx.hash);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>{provider ? "Connected!" : "Not connected"}</div>
        {provider ? (
          chainId === targetChainId ? (
            <>
              <input
                placeholder={"Ethereum Address"}
                onChange={(e) => setAddress(e.target.value)}
              />
              <button onClick={mint}>{`Mint ${mintAmount} tokens`}</button>
              {txHash && (
                <a
                  target="blank"
                  rel="noreferrer noopener"
                  href={formatEtherscanTxUrl(targetNetwork, txHash)}
                >{`TX Hash: ${txHash}`}</a>
              )}
            </>
          ) : (
            <>
              <p>{`Please switch to ${targetNetwork}`}</p>
            </>
          )
        ) : (
          <button onClick={connect}>{`Connect`}</button>
        )}
      </header>
    </div>
  );
}

export default App;
