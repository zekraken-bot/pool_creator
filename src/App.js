import "./App.css";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Grid, TextField, Button } from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { CreateABI } from "./abi/WeightedPoolFactory";
import { ERC20 } from "./abi/erc20";

function App() {
  const FactoryAddress = "0x230a59f4d9adc147480f03b0d3fffecd56c3289a";
  const [walletAddress, setWalletAddress] = useState();
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [network, setNetwork] = useState();
  const [poolName, setPoolName] = useState("test");
  const [poolSymbol, setPoolSymbol] = useState("test");
  const [swapFeePercentage, setSwapFeePercentage] =
    useState("10000000000000000");
  const [ownerAddress, setOwnerAddress] = useState(
    "0xafFC70b81D54F229A5F50ec07e2c76D2AAAD07Ae"
  );
  const [approvedTokens, setApprovedTokens] = useState(
    new Array(8).fill(false)
  );
  const contractAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const amountToApprove =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  const rows = new Array(8).fill(null);
  const [tokenAddresses, setTokenAddresses] = useState(new Array(8).fill(""));
  const [tokenWeights, setTokenWeights] = useState(new Array(8).fill(""));
  const [rateProviders, setRateProviders] = useState(new Array(8).fill(""));
  const handleInputChange = (event, rowIndex, setter) => {
    const newValue = event.target.value;
    setter((prevState) => {
      const newState = [...prevState];
      newState[rowIndex] = newValue;
      return newState;
    });
  };

  useEffect(() => {
    async function checkWalletonLoad() {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length) {
        const networkId = await window.ethereum.request({
          method: "net_version",
        });
        setNetwork(getNetworkName(networkId));
        console.log("Your wallet is connected");
        const ethaddress = accounts[0];
        setWalletAddress(ethaddress);
        setButtonText("Wallet Connected");
      } else {
        console.log("Metamask is not connected");
      }
    }

    window.ethereum.on("chainChanged", () => {
      checkWalletonLoad();
    });
    window.ethereum.on("accountsChanged", () => {
      checkWalletonLoad();
    });

    async function checkApprovedTokens() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newApprovedTokens = [...approvedTokens];
      for (let i = 0; i < tokenAddresses.length; i++) {
        const tokenAddress = tokenAddresses[i];
        if (!tokenAddress) continue;
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20,
          provider
        );
        const approvedAmount = await tokenContract.allowance(
          walletAddress,
          contractAddress
        );
        newApprovedTokens[i] = approvedAmount.gte(amountToApprove);
      }
      setApprovedTokens(newApprovedTokens);
    }

    checkWalletonLoad();
    checkApprovedTokens();
  }, [tokenAddresses, approvedTokens, walletAddress]);

  function getNetworkName(networkId) {
    switch (networkId) {
      case "1":
        return "Mainnet";
      case "3":
        return "Ropsten";
      case "4":
        return "Rinkeby";
      case "5":
        return "Goerli";
      default:
        return "Unknown network";
    }
  }

  async function requestAccount() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const ethaddress = accounts[0];
        setWalletAddress(ethaddress);
        window.ethereum.on("accountsChanged", requestAccount);
        setButtonText("Wallet Connected");
      } catch (error) {
        console.log("Error connecting...");
      }
    } else {
      console.log("Metamask not detected");
    }
  }

  async function createPool() {
    await requestAccount();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(FactoryAddress, CreateABI, signer);
    const gasoverride = { gasLimit: 6000000 };

    const filteredTokens = tokenAddresses.filter((token) => token !== "");
    const filteredWeights = tokenWeights.filter((weight) => weight !== "");

    // token address, token weights, rate providers
    const tokens = filteredTokens;
    const weights = filteredWeights;
    const defaultRateProvider = "0x0000000000000000000000000000000000000000";
    const filteredRateProviders = rateProviders.filter(
      (rateProvider) => rateProvider !== ""
    );
    const rateProvidersLength = tokens.length;

    // Fill rateProviders with the default value based on the length of tokens array
    for (let i = filteredRateProviders.length; i < rateProvidersLength; i++) {
      filteredRateProviders.push(defaultRateProvider);
    }

    await ethcontract.create(
      poolName,
      poolSymbol,
      tokens,
      weights,
      filteredRateProviders,
      swapFeePercentage,
      ownerAddress,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      gasoverride
    );
  }

  // const checkAllowance = async (tokenAddress, contractAddress) => {
  //   const provider = new ethers.providers.Web3Provider(window.ethereum);
  //   const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
  //   const approvedAmount = await tokenContract.allowance(
  //     walletAddress,
  //     contractAddress
  //   );
  //   return approvedAmount.gte(amountToApprove);
  // };

  const handleApprovalClick = async (tokenAddress, contractAddress, index) => {
    // Token needs to be approved, call approve() method on token contract
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const gasLimit = 6000000;
    const tx = await tokenContract.approve(contractAddress, amountToApprove, {
      gasLimit,
    });
    await tx.wait();
    // Update state
    setApprovedTokens((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  const additionalTextFields = [
    {
      label: "Pool Name",
      id: "poolName",
      value: poolName,
      onChange: setPoolName,
    },
    {
      label: "Pool Symbol",
      id: "poolSymbol",
      value: poolSymbol,
      onChange: setPoolSymbol,
    },
    {
      label: "Swap Fee Percentage",
      id: "swapFeePercentage",
      value: swapFeePercentage,
      onChange: setSwapFeePercentage,
    },
    {
      label: "Owner Address",
      id: "ownerAddress",
      value: ownerAddress,
      onChange: setOwnerAddress,
    },
  ].map(({ label, id, value, onChange }, index) => (
    <Grid item xs={8} key={index} sx={{ padding: "6px" }}>
      <TextField
        label={label}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ sx: { color: "white" } }}
        InputProps={{
          sx: { color: "yellow", width: "325px", fontSize: "12px" },
        }}
      />
    </Grid>
  ));

  return (
    <>
      <header className="headerContent">
        <br />
        <p align="right">
          <Button variant="contained" onClick={requestAccount}>
            {buttonText}
          </Button>
        </p>
        <p align="right">Wallet Address: {walletAddress}</p>
        <p align="right">Network: {network}</p>
      </header>
      <br />
      <div className="mainContent">
        <Button variant="contained" onClick={createPool}>
          Create Pool
        </Button>
      </div>
      <br />
      <Grid container spacing={1} justifyContent="center">
        <Grid item xs={3}>
          {additionalTextFields}
        </Grid>
      </Grid>
      <br />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Addresses
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Weights
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Rate Providers
              </Typography>
            </Grid>
            <Grid item xs={3} />

            {rows.map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <Grid item xs={3}>
                  <TextField
                    label={`Token Address ${rowIndex + 1}`}
                    value={tokenAddresses[rowIndex]}
                    onChange={(event) =>
                      handleInputChange(event, rowIndex, setTokenAddresses)
                    }
                    fullWidth
                    InputProps={{
                      sx: {
                        color: "yellow",
                        fontSize: "12px",
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: "white",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={`Token Weight ${rowIndex + 1}`}
                    value={tokenWeights[rowIndex]}
                    onChange={(event) =>
                      handleInputChange(event, rowIndex, setTokenWeights)
                    }
                    fullWidth
                    InputProps={{
                      sx: {
                        color: "yellow",
                        fontSize: "12px",
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: "white",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={`Rate Provider ${rowIndex + 1}`}
                    value={rateProviders[rowIndex]}
                    onChange={(event) =>
                      handleInputChange(event, rowIndex, setRateProviders)
                    }
                    fullWidth
                    InputProps={{
                      sx: {
                        color: "yellow",
                        fontSize: "12px",
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: "white",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={3} container alignItems="center">
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={approvedTokens[rowIndex]}
                    onClick={() =>
                      handleApprovalClick(
                        tokenAddresses[rowIndex],
                        contractAddress,
                        rowIndex
                      )
                    }
                  >
                    {approvedTokens[rowIndex]
                      ? "Token Approved"
                      : `Approve Token ${rowIndex + 1}`}
                  </Button>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Container>
      </Box>
      <br />
      <br />
      <footer className="footer">
        open source project created by&nbsp;
        <a
          href="https://twitter.com/The_Krake"
          target="_blank"
          rel="noopener noreferrer"
        >
          @ZeKraken
        </a>
        &nbsp;:&nbsp;
        <a
          href="https://github.com/zekraken-bot/pool_creator"
          target="_blank"
          rel="noopener noreferrer"
        >
          github link
        </a>
      </footer>
      <br />
    </>
  );
}

export default App;
