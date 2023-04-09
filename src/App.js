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
    await requestAccount();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(FactoryAddress, CreateABI, signer);
    const gasoverride = { gasLimit: 6000000 };
    // token address, token weights, rate providers
    const tokens = textFieldValues[0].map(token => token === '' ? '0x0000000000000000000000000000000000000000' : token);
    const weights = textFieldValues[1].map(weight => weight === '' ? '000000000000000000' : weight);
    const rateProviders = textFieldValues[2].map(rateProvider => rateProvider === '' ? '0x0000000000000000000000000000000000000000' : rateProvider);
    await ethcontract.create(
      poolName, 
      poolSymbol, 
      tokens,
      weights,
      rateProviders,
      swapFeePercentage,
      ownerAddress, 
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      gasoverride
    );
  }

  const numRows = 8;
  const numCols = 3;
  const [textFieldValues, setTextFieldValues] = useState(Array(numCols).fill().map(() => (
    Array(numRows).fill('')
  )));
  
  const handleTextFieldChange = (colIndex, rowIndex, value) => {
    const newTextFieldValues = [...textFieldValues];
    newTextFieldValues[colIndex][rowIndex] = value;
    setTextFieldValues(newTextFieldValues);
  };
  
  const textFields = Array(numCols).fill().map((_, colIndex) => (
    Array(numRows).fill().map((_, rowIndex) => (
      <Grid item xs={12} key={rowIndex} sx={{ padding: '3px' }}>
        <TextField
          label={colIndex === 0 ? `Token Address ${rowIndex + 1}` :
                 colIndex === 1 ? `Token Weight ${rowIndex + 1}` :
                                  `Rate Provider ${rowIndex + 1}`}
          value={textFieldValues[colIndex][rowIndex]}
          onChange={(e) => handleTextFieldChange(colIndex, rowIndex, e.target.value)}
          InputLabelProps={{ sx: { color: 'white' } }}
          InputProps={{ sx: { color: 'yellow', width: '325px', fontSize: '12px' } }}
        />
      </Grid>
    ))
  ))

  const additionalTextFields = [{label: "Pool Name", id: "poolName", value: poolName, onChange: setPoolName },{label: "Pool Symbol", id: "poolSymbol", value: poolSymbol, onChange: setPoolSymbol },{label: "Swap Fee Percentage", id: "swapFeePercentage", value: swapFeePercentage, onChange: setSwapFeePercentage },{label: "Owner Address", id: "ownerAddress", value: ownerAddress, onChange: setOwnerAddress },].map(({label, id, value, onChange}, index) => (
    <Grid item xs={12} key={index} sx={{ padding: '3px' }}>
      <TextField
        label={label}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ sx: { color: 'white' } }}
        InputProps={{ sx: { color: 'yellow', width: '325px', fontSize: '12px' } }}
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
      <br />
      <Grid container spacing={1} justifyContent="center">
        <Grid item xs={3}>
          {additionalTextFields}
        </Grid>
      </Grid>
      <Grid container spacing={1} justifyContent="center">
        {textFields.map((column, index) => (
          <Grid item xs={3} key={index}>
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
