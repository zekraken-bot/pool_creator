import './App.css';
import { useEffect, useState } from "react"
import { ethers } from 'ethers';
import { Grid, TextField, Button } from '@mui/material'
import { CreateABI, FactoryAddress } from './abi/WeightedPoolFactory'

function App() {
  
  const [walletAddress, setWalletAddress] = useState()
  const [buttonText, setButtonText] = useState ('Connect Wallet')
  const [network, setNetwork] = useState()
  const [poolName, setPoolName] = useState('test');
  const [poolSymbol, setPoolSymbol] = useState('test');
  const [swapFeePercentage, setSwapFeePercentage] = useState('10000000000000000');
  const [ownerAddress, setOwnerAddress] = useState('0xafFC70b81D54F229A5F50ec07e2c76D2AAAD07Ae');
  
  useEffect(() => {
    async function checkWalletonLoad() {
      const accounts = await window.ethereum.request({method: 'eth_accounts'})
        if (accounts.length) {
          const networkId = await window.ethereum.request({method: 'net_version'})
          setNetwork(getNetworkName(networkId))
          console.log('Your wallet is connected')
          setWalletAddress([accounts[0].slice(0,5),'...',accounts[0].slice(37,42)])
          setButtonText('Wallet Connected')
        } else {
          console.log("Metamask is not connected")
        }
    }
    
    window.ethereum.on('chainChanged', () => {
      checkWalletonLoad()
    })
    window.ethereum.on('accountsChanged', () => {
      checkWalletonLoad()
    })
    checkWalletonLoad()
  },[])

  function getNetworkName(networkId) {
    switch (networkId) {
      case '1':
        return 'Mainnet'
      case '3':
        return 'Ropsten'
      case '4':
        return 'Rinkeby'
      case '5':
        return 'Goerli'
      default:
        return 'Unknown network'
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
    const gasoverride = { gasLimit: 6000000 }
    await ethcontract.create(poolName, poolSymbol, ["0xdfcea9088c8a88a76ff74892c1457c17dfeef9c1", "0xfa8449189744799ad2ace7e0ebac8bb7575eff47"],["800000000000000000", "200000000000000000"], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"], "10000000000000000", "0xaffc70b81d54f229a5f50ec07e2c76d2aaad07ae", "0x0000000000000000000000000000000000000000000000000000000000000000", gasoverride)
  }

  const numRows = 8;
  const numCols = 3;
  const textFields = Array(numCols).fill().map(() => (
    Array(numRows).fill().map((_, index) => (
      <Grid item xs={12} key={index}>
        <TextField
          label={''}
          InputLabelProps={{ sx: { color: 'white' } }}
          InputProps={{ sx: { color: 'white' } }}
          FormHelperTextProps={{ sx: { color: 'white' } }}
        />
      </Grid>
    ))
  ))

  const additionalTextFields = [  { label: "Pool Name", id: "poolName", value: poolName, onChange: setPoolName },  { label: "Pool Symbol", id: "poolSymbol", value: poolSymbol, onChange: setPoolSymbol },  { label: "Swap Fee Percentage", id: "swapFeePercentage", value: swapFeePercentage, onChange: setSwapFeePercentage },  { label: "Owner Address", id: "ownerAddress", value: ownerAddress, onChange: setOwnerAddress },].map(({ label, id, value, onChange }, index) => (
    <Grid item xs={12} key={index}>
      <TextField
        label={label}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ sx: { color: "white" } }}
        InputProps={{ sx: { color: "white" } }}
        FormHelperTextProps={{ sx: { color: "white" } }}
      />
    </Grid>
  ))

  return (
    <>
      <header className="headerContent">
      <br />      
      <p align="right"><Button variant="contained" onClick={requestAccount}>{buttonText}</Button></p>
      <p align="right">Wallet Address: {walletAddress}</p>
      <p align="right">Network: {network}</p>
      </header>
      <br />
      <div className="mainContent">
      <Button variant="contained" onClick={createPool}>Create Pool</Button>
      </div>
      <Grid container spacing={1} justifyContent="center">
        <Grid item xs={3} sx={{ border: '1px solid black' }}>
          {additionalTextFields}
        </Grid>
      </Grid>
      <Grid container spacing={1} justifyContent="center">
        {textFields.map((column, index) => (
          <Grid item xs={3} key={index} sx={{ border: '1px solid black' }}>
            <h2 className="column-header">
              {index === 0 && 'Token Addresses'}
              {index === 1 && 'Token Weights'}
              {index === 2 && 'Rate Providers'}
            </h2>
            {column}
          </Grid>
        ))}
      </Grid>
    <br />
    <br />
    <br />
    <br />
    <footer className="footer">open source project created by&nbsp;<a href="https://twitter.com/The_Krake" target="_blank" rel="noopener noreferrer">@ZeKraken</a>&nbsp;:&nbsp;<a href="https://github.com/zekraken-bot/pool_creator" target="_blank" rel="noopener noreferrer">github link</a></footer>
    <br />
    </>
  )
}

export default App;
