import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import toast, { Toaster } from "react-hot-toast";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

  const [totalWaves, setTotalWaves] = useState(0);
  const [loading, setLoading] = useState(false);
  const [yourWaveTxn, setYourWaveTxn] = useState("");

  const [message, setMessage] = useState("");

  const contractAddress = import.meta.env.VITE_WAVEPORTAL_CONTRACT_ADDRESS;
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
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
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = waves.map((wave) => ({
          address: wave.waver,
          // How to translate timestamp from blockchain to javascript mainstream date
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        }));

        /*
         * Store our data in React State
         */

        console.log(wavesCleaned);
        setAllWaves(wavesCleaned);
      } else {
        toast.error("No ethereum provider found");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
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

  useEffect(() => {
    getAllWaves();
  }, []);

  /**
   * Listen in for emitter events!
   * Like websockets, we can listen in for events from our contract
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    getTotalWaves();

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
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

            <div className="bio">
              <small>This program using ethereum Rinkeby Test Network</small>
            </div>
            <input
              type="text"
              onChange={(e) => setMessage(e.target.value)}
              className="messageInput"
            />
            <p className="bio">Total Waves : {totalWaves}</p>
            {yourWaveTxn && (
              <p className="bio">Your last wave txn hash : {yourWaveTxn}</p>
            )}

            <button
              className="waveButton"
              disabled={!currentAccount || !message}
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

            {allWaves.map((wave, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "OldLace",
                  marginTop: "16px",
                  padding: "8px",
                }}
              >
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default App;
