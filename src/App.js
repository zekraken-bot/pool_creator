import './App.css';
import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import Button from '@mui/material/Button';
import { CreateABI, FactoryAddress } from './abi/WeightedPoolFactory'

function App() {
  
  const [walletAddress, setWalletAddress] = useState()
  const [buttonText, setButtonText] = useState ('Connect Wallet')
  const [network, setNetwork] = useState('')
  
  useEffect(() => {
    checkWalletonLoad()
  },[])

  async function checkWalletonLoad() {
    const accounts = await window.ethereum.request({method: 'eth_accounts'})
      if (accounts.length) {
        console.log('Your wallet is connected')
        setWalletAddress([accounts[0].slice(0,5),'...',accounts[0].slice(37,42)])
        setButtonText('Wallet Connected')
      } else {
        console.log("Metamask is not connected")
      }
  }
  
  async function requestAccount() {
    if(window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })     
        setWalletAddress([accounts[0].slice(0,5),'...',accounts[0].slice(37,42)])
        window.ethereum.on('accountsChanged', requestAccount)
        setButtonText('Wallet Connected')
      } catch(error) {
        console.log('Error connecting...')
      }
    } else {
      console.log('Metamask not detected')
    }
  } 
  
  async function createPool() {
    await requestAccount()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    const signer = await provider.getSigner()
    const ethcontract = new ethers.Contract(FactoryAddress, CreateABI, signer)
    const overrides = { gasLimit: 6000000 }
    await ethcontract.create("test", "Tester", ["0xdfcea9088c8a88a76ff74892c1457c17dfeef9c1", "0xfa8449189744799ad2ace7e0ebac8bb7575eff47"],["800000000000000000", "200000000000000000"], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], "10000000000000000", "0xaffc70b81d54f229a5f50ec07e2c76d2aaad07ae", "0x0000000000000000000000000000000000000000000000000000000000000000", overrides)
  }

  return (
    <>
      <header className="headerContent">
      <br />      
      <p align="right"><Button variant="contained" color="primary" onClick={requestAccount}>{buttonText}</Button></p>
      <p align="right">Wallet Address: {walletAddress}</p>
      <p align="right">Network: {network}</p>
      </header>
      <br />
      <div className="mainContent">
      <Button variant="contained" color="primary" onClick={createPool}>Create Pool</Button>
      </div>
    </>
  );
}

export default App;
