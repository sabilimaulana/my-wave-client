import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import toast, { Toaster } from "react-hot-toast";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [loading, setLoading] = useState(false);
  const [yourWaveTxn, setYourWaveTxn] = useState("");

  const contractAddress = import.meta.env.VITE_WAVEPORTAL_CONTRACT_ADDRESS;
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  const getTotalWaves = () => {
    setLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        wavePortalContract
          .getTotalWaves()
          .then((total) => setTotalWaves(total.toNumber()));
      }
    } catch (error) {
      toast.error("Error getting total waves");
    }
    setLoading(false);
  };

  const checkIfWalletIsConnected = async () => {
    setLoading(true);

    try {
      /*
       * First make sure we have access to window.ethereum
       */
      const { ethereum } = window;

      if (!ethereum) {
        toast.error("Make sure you have metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
      } else {
        toast.error("No authorized account found");
      }
    } catch (error) {
      toast.error("Error getting accounts");
    }
    setLoading(false);
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    setLoading(true);

    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      toast.success("Connected");
      setCurrentAccount(accounts[0]);
    } catch (error) {
      toast.error("Error connecting wallet");
    }
    setLoading(false);
  };

  const wave = async () => {
    setLoading(true);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave();
        await waveTxn.wait();
        setYourWaveTxn(waveTxn.hash);

        let count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
        toast.success("Total Waves updated!");
      } else {
        toast.error("No ethereum provider found");
      }
    } catch (error) {
      toast.error("Error waveing");
    }
    setLoading(false);
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    getTotalWaves();
  }, []);

  return (
    <>
      <Toaster />
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading</p>
      ) : (
        <div className="mainContainer">
          <div className="dataContainer">
            <div className="header">👋 Hey there!</div>

            <div className="bio">
              Hi! I am Bili, just student that learning web3, Connect your
              Ethereum wallet and wave at me!
            </div>

            <p className="bio">Total Waves : {totalWaves}</p>
            {yourWaveTxn && (
              <p className="bio">Your Wave Txn Hash : {yourWaveTxn}</p>
            )}
            <button
              className="waveButton"
              disabled={!currentAccount}
              onClick={wave}
            >
              Wave at Me
            </button>

            {/*
             * If there is no currentAccount render this button
             */}
            {!currentAccount && (
              <button className="waveButton" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default App;
