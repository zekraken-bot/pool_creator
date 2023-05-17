import "./App.css";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { Grid, TextField, Button, ButtonGroup, Select, MenuItem, Container, Box } from "@mui/material";

import { ethers } from "ethers";

import { CreateWeightedABI } from "./abi/WeightedPoolFactory";
import { weightedPool } from "./abi/WeightedPool";
import { CreateComposableABI } from "./abi/ComposableStableFactory";
import { composablePool } from "./abi/ComposablePool";
import { ERC20 } from "./abi/erc20";
import { vaultABI } from "./abi/BalVault";

function App() {
  const FactoryAddressWeighted = {
    Goerli: "0x230a59f4d9adc147480f03b0d3fffecd56c3289a",
    Mainnet: "0x897888115Ada5773E02aA29F775430BFB5F34c51",
    Polygon: "0xFc8a407Bba312ac761D8BFe04CE1201904842B76",
    Arbitrum: "0xc7E5ED1054A24Ef31D827E6F86caA58B3Bc168d7",
    Gnosis: "0x6CaD2ea22BFA7F4C14Aae92E47F510Cd5C509bc7",
  };
  const FactoryAddressComposable = {
    Goerli: "0x1802953277FD955f9a254B80Aa0582f193cF1d77",
    Mainnet: "0xfADa0f4547AB2de89D1304A668C39B3E09Aa7c76",
    Polygon: "0x6Ab5549bBd766A43aFb687776ad8466F8b42f777",
    Arbitrum: "0x2498A2B0d6462d2260EAC50aE1C3e03F4829BA95",
    Gnosis: "0xD87F44Df0159DC78029AB9CA7D7e57E7249F5ACD",
  };
  const [walletAddress, setWalletAddress] = useState("");
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [network, setNetwork] = useState("");
  const [poolName, setPoolName] = useState("");
  const [poolSymbol, setPoolSymbol] = useState("");
  const [swapFeePercentage, setSwapFeePercentage] = useState("");
  const [amplificationFactor, setAmplificationFactor] = useState("");
  const [rateCacheDuration, setRateCacheDuration] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b");
  const [poolId, setPoolId] = useState("");
  const [poolContract, setPoolContract] = useState("");
  const [poolType, setPoolType] = useState("Weighted");
  const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

  const [rows, setRows] = useState([]);
  const [tokenAddresses, setTokenAddresses] = useState([]);
  const [tokenWeights, setTokenWeights] = useState([]);
  const [rateProviders, setRateProviders] = useState([]);
  const [tokenAmounts, setTokenAmounts] = useState([]);
  const [approvedTokens, setApprovedTokens] = useState([]);
  const [yieldProtocolFeeExempt, setYieldProtocolFeeExempt] = useState([]);

  const handleInputChange = (event, rowIndex, setter) => {
    const newValue = event.target.value;
    setter((prevState) => {
      const newState = [...prevState];
      newState[rowIndex] = newValue;
      return newState;
    });
  };

  const handleButtonClick = (index, setter, value) => {
    const updatedArray = [...yieldProtocolFeeExempt];
    updatedArray[index] = value;
    setter(updatedArray);
  };

  useEffect(() => {
    if (poolType === "Weighted") {
      setRows(new Array(8).fill(null));
      setTokenAddresses(new Array(8).fill(""));
      setTokenWeights(new Array(8).fill(""));
      setRateProviders(new Array(8).fill(""));
      setTokenAmounts(new Array(8).fill(""));
      setApprovedTokens(new Array(8).fill(false));
    } else if (poolType === "ComposableStable") {
      setRows(new Array(5).fill(null));
      setTokenAddresses(new Array(5).fill(""));
      setYieldProtocolFeeExempt(new Array(5).fill(""));
      setRateProviders(new Array(5).fill(""));
      setTokenAmounts(new Array(5).fill(""));
      setApprovedTokens(new Array(5).fill(false));
    }
    if (window.ethereum) {
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
      async function updateNetwork() {
        const networkId = await window.ethereum.request({
          method: "net_version",
        });
        setNetwork(getNetworkName(networkId));
      }

      const onChainChanged = () => {
        updateNetwork();
      };

      const onAccountsChanged = () => {
        checkWalletonLoad();
      };

      window.ethereum.on("chainChanged", onChainChanged);
      window.ethereum.on("accountsChanged", onAccountsChanged);

      checkWalletonLoad();

      return () => {
        window.ethereum.removeListener("chainChanged", onChainChanged);
        window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      };
    } else {
      console.log("Metamask not detected");
    }
  }, [poolType]);

  function getNetworkName(networkId) {
    switch (networkId) {
      case "1":
        return "Mainnet";
      case "5":
        return "Goerli";
      case "137":
        return "Polygon";
      case "42161":
        return "Arbitrum";
      case "100":
        return "Gnosis";
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
        setButtonText("Wallet Connected");
      } catch (error) {
        console.log("Error connecting...");
      }
    } else {
      console.log("Metamask not detected");
    }
  }

  async function checkApprovedTokens(updatedTokenAddresses, updatedTokenAmounts) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const newApprovedTokens = [...approvedTokens];
    for (let i = 0; i < updatedTokenAddresses.length; i++) {
      const tokenAddress = updatedTokenAddresses[i];
      if (!tokenAddress) {
        newApprovedTokens[i] = false;
        continue;
      }

      const decimals = await checkDecimals(tokenAddress); // Get the number of decimals for the token

      const tokenAmount = updatedTokenAmounts[i];
      if (!tokenAmount) {
        newApprovedTokens[i] = false;
        continue;
      }

      const requiredAmount = ethers.utils.parseUnits(tokenAmount, decimals); // Convert token amount to the required format using the obtained decimals

      const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
      const approvedAmount = await tokenContract.allowance(walletAddress, vaultAddress);

      newApprovedTokens[i] = approvedAmount.gte(requiredAmount);
    }
    setApprovedTokens(newApprovedTokens);
  }

  const handleTokenAmountChange = async (event, index) => {
    const newTokenAmounts = [...tokenAmounts];
    newTokenAmounts[index] = event.target.value;
    setTokenAmounts(newTokenAmounts);

    if (tokenAddresses[index]) {
      const decimals = await checkDecimals(tokenAddresses[index]);
      checkApprovedTokens(tokenAddresses, newTokenAmounts, decimals);
    }
  };

  async function checkDecimals(tokenAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const decimals = await tokenContract.decimals();
    return decimals;
  }

  async function createPoolWeighted() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(FactoryAddressWeighted[network], CreateWeightedABI, signer);

    // only keep non-blank textfields
    const filteredTokens = tokenAddresses.filter((token) => token !== "");
    const filteredWeights = tokenWeights.filter((weight) => weight !== "");
    const weights = filteredWeights.map((weight) => ethers.utils.parseUnits((weight / 100).toString(), 18));

    // fill rateProviders with the default value if token address rows are blank
    const defaultRateProvider = "0x0000000000000000000000000000000000000000";
    const filteredRateProviders = rateProviders.filter((rateProvider) => rateProvider !== "");
    const rateProvidersLength = filteredTokens.length;
    for (let i = filteredRateProviders.length; i < rateProvidersLength; i++) {
      filteredRateProviders.push(defaultRateProvider);
    }

    // convert swap fee to ethers format
    const swapFeePercentageWithDecimals = ethers.utils.parseUnits(swapFeePercentage.toString(), 18);

    // create random salt value
    const salt = [...crypto.getRandomValues(new Uint8Array(32))].map((m) => ("0" + m.toString(16)).slice(-2)).join("");

    const salt0x = "0x" + salt;

    const transaction = await ethcontract.create(poolName, poolSymbol, filteredTokens, weights, filteredRateProviders, swapFeePercentageWithDecimals, ownerAddress, salt0x);
    const receipt = await transaction.wait();
    const newPoolContract = receipt.logs[0].address;

    const ethcontract2 = new ethers.Contract(newPoolContract, weightedPool, signer);
    const getPoolId = await ethcontract2.getPoolId();

    setPoolId(getPoolId);
  }

  async function createPoolComposable() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(FactoryAddressComposable[network], CreateComposableABI, signer);

    // only keep non-blank textfields
    const defaultProtocolFeeExempt = false;
    let filteredTokens = tokenAddresses.filter((token) => token !== "");
    let filteredProtocolFeeExempt = yieldProtocolFeeExempt.filter((feebool) => feebool !== "");
    const protocolFeeExemptLength = filteredTokens.length;
    for (let i = filteredProtocolFeeExempt.length; i < protocolFeeExemptLength; i++) {
      filteredProtocolFeeExempt.push(defaultProtocolFeeExempt);
    }

    // fill rateProviders with the default value if token address rows are blank
    const defaultRateProvider = "0x0000000000000000000000000000000000000000";
    let filteredRateProviders = rateProviders.filter((rateProvider) => rateProvider !== "");
    const rateProvidersLength = filteredTokens.length;
    for (let i = filteredRateProviders.length; i < rateProvidersLength; i++) {
      filteredRateProviders.push(defaultRateProvider);
    }

    // Create a map linking each token address to its corresponding protocol fee exempt status and rate provider.
    const tokenMap = {};
    filteredTokens.forEach((token, index) => {
      tokenMap[token] = { protocolFeeExempt: filteredProtocolFeeExempt[index], rateProvider: filteredRateProviders[index] };
    });

    // Sort token addresses in ascending order and regenerate the other arrays in this new order.
    filteredTokens = Object.keys(tokenMap).sort();
    filteredProtocolFeeExempt = filteredTokens.map((token) => tokenMap[token].protocolFeeExempt);
    filteredRateProviders = filteredTokens.map((token) => tokenMap[token].rateProvider);

    // add rate durations for every row there is a token address
    const rateCacheDurations = Array.from({ length: tokenAddresses.filter((address) => address !== "").length }, (_, index) => rateCacheDuration);

    // convert swap fee to ethers format
    const swapFeePercentageWithDecimals = ethers.utils.parseUnits(swapFeePercentage.toString(), 18);

    // create random salt value
    const salt = [...crypto.getRandomValues(new Uint8Array(32))].map((m) => ("0" + m.toString(16)).slice(-2)).join("");

    const salt0x = "0x" + salt;

    const transaction = await ethcontract.create(
      poolName,
      poolSymbol,
      filteredTokens,
      amplificationFactor,
      filteredRateProviders,
      rateCacheDurations,
      filteredProtocolFeeExempt,
      swapFeePercentageWithDecimals,
      ownerAddress,
      salt0x
    );
    const receipt = await transaction.wait();
    const newPoolContract = receipt.logs[0].address;
    setPoolContract(newPoolContract);

    const ethcontract2 = new ethers.Contract(newPoolContract, composablePool, signer);
    const getPoolId = await ethcontract2.getPoolId();

    setPoolId(getPoolId);
  }

  async function initJoinWeighted() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(vaultAddress, vaultABI, signer);

    const assets = tokenAddresses.filter((address) => address !== "");
    const amountsIn = tokenAmounts.filter((amount) => amount !== "");

    const sortedAmountsIn = [];
    const multipliedAmounts = [];
    for (let i = 0; i < amountsIn.length; i++) {
      const tokenAddress = assets[i];
      const amount = amountsIn[i];
      if (tokenAddress && amount) {
        const decimals = await checkDecimals(tokenAddress);
        const adjustedAmount = ethers.utils.parseUnits(amount, decimals);
        sortedAmountsIn.push(adjustedAmount.toString());
        multipliedAmounts.push(adjustedAmount);
      }
    }

    const linkedItems = assets.map((asset, index) => [asset, multipliedAmounts[index]]);
    linkedItems.sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });

    const sortedAssets = linkedItems.map((item) => item[0]);
    const sortedAmountsIn2 = linkedItems.map((item) => item[1].toString());

    const JOIN_KIND_INIT = 0;

    const userData = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256[]"], [JOIN_KIND_INIT, sortedAmountsIn2]);

    const joinRequest = {
      assets: sortedAssets,
      maxAmountsIn: sortedAmountsIn2,
      userData,
      fromInternalBalance: false,
    };

    await ethcontract.joinPool(poolId, walletAddress, walletAddress, joinRequest);
  }

  async function initJoinComposable() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(vaultAddress, vaultABI, signer);
    const poolBPTAmt = "5192296858534827.628530496329";

    const assets = tokenAddresses.filter((address) => address !== "").concat(poolContract);
    const amountsIn = tokenAmounts.filter((amount) => amount !== "").concat(poolBPTAmt);

    const sortedAmountsIn = [];
    const multipliedAmounts = [];
    for (let i = 0; i < amountsIn.length; i++) {
      const tokenAddress = assets[i];
      const amount = amountsIn[i];
      if (tokenAddress && amount) {
        const decimals = await checkDecimals(tokenAddress);
        const adjustedAmount = ethers.utils.parseUnits(amount, decimals);
        sortedAmountsIn.push(adjustedAmount.toString());
        multipliedAmounts.push(adjustedAmount);
      }
    }

    const linkedItems = assets.map((asset, index) => [asset, multipliedAmounts[index]]);
    linkedItems.sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });

    const sortedAssets = linkedItems.map((item) => item[0]);
    const sortedAmountsIn2 = linkedItems.map((item) => item[1].toString());

    const JOIN_KIND_INIT = 0;

    const userData = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256[]"], [JOIN_KIND_INIT, sortedAmountsIn2]);

    const joinRequest = {
      assets: sortedAssets,
      maxAmountsIn: sortedAmountsIn2,
      userData,
      fromInternalBalance: false,
    };

    await ethcontract.joinPool(poolId, walletAddress, walletAddress, joinRequest);
  }

  const handleApprovalClick = async (tokenAddress, vaultAddress, index) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const amountToApprove = ethers.constants.MaxUint256;
    const tx = await tokenContract.approve(vaultAddress, amountToApprove);
    await tx.wait();
    setApprovedTokens((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  const additionalTextFields = [
    {
      label: "Pool Name\u00A0\u00A0\u00A0\u00A0",
      id: "poolName",
      value: poolName,
      onChange: setPoolName,
    },
    {
      label: "Pool Symbol\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "poolSymbol",
      value: poolSymbol,
      onChange: setPoolSymbol,
    },
    {
      label: "Swap Fee Percentage\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "swapFeePercentage",
      value: swapFeePercentage,
      onChange: setSwapFeePercentage,
    },
    poolType === "ComposableStable" && {
      label: "Amplification Factor\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "amplificationFactor",
      value: amplificationFactor,
      onChange: setAmplificationFactor,
    },
    poolType === "ComposableStable" && {
      label: "Rate Cache Duration\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "rateCacheDuration",
      value: rateCacheDuration,
      onChange: setRateCacheDuration,
    },
    {
      label: "Owner Address\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "ownerAddress",
      value: ownerAddress,
      onChange: setOwnerAddress,
    },
    {
      label: "Pool ID\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "poolId",
      value: poolId,
      onChange: setPoolId,
    },
    poolType === "ComposableStable" && {
      label: "Pool Contract\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "poolId",
      value: poolContract,
      onChange: setPoolContract,
    },
  ]
    .filter(Boolean)
    .map(({ label, id, value, onChange }, index) => (
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div>
            <label style={{ marginLeft: "20px", fontSize: "14px" }}>Pool Type:</label>
            <br />
            <Select value={poolType} onChange={(e) => setPoolType(e.target.value)} sx={{ backgroundColor: "lightgray" }}>
              <MenuItem value="Weighted">Weighted</MenuItem>
              <MenuItem value="ComposableStable">ComposableStable</MenuItem>
            </Select>
          </div>
          <Button variant="contained" onClick={requestAccount}>
            {buttonText}
          </Button>
        </div>
        <p align="right">Wallet Address: {walletAddress && `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 6)}`}</p>
        <p align="right">Network: {network}</p>
      </header>
      <br />
      <div className="mainContent" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ alignSelf: "flex-start" }}>
          <ul style={{ textAlign: "left" }}>
            {poolType === "Weighted" ? (
              <>
                <strong>
                  <u>Usage Tips for Weighted:</u>
                </strong>
                <li>swap fee percentage should be entered as 0.01 for 1%</li>
                <li>token weights should be entered as 80 for 80% or 50 for 50%</li>
                <li>if a rate provider is not supplied, the 0x0000 address will be used</li>
                <li>token amounts should be entered in acutal amounts, 0.001 ETH for example</li>
                <li>pool id field available to perform the init join separately (find pool id on the etherscan contract)</li>
              </>
            ) : (
              <>
                <strong>
                  <u>Usage Tips for ComposableStable:</u>
                </strong>
                <li>swap fee percentage should be entered as 0.01 for 1%</li>
                <li>protocol fee exempt is set to false by default</li>
                <li>if a rate provider is not supplied, the 0x0000 address will be used</li>
                <li>token amounts should be entered in acutal amounts, 0.001 ETH for example</li>
                <li>pool id and pool contract fields available to perform the init join separately (find pool id on the etherscan contract)</li>
              </>
            )}
          </ul>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button variant="contained" onClick={poolType === "Weighted" ? createPoolWeighted : createPoolComposable} sx={{ marginRight: 2 }}>
            Create Pool
          </Button>
          <Button variant="contained" onClick={poolType === "Weighted" ? initJoinWeighted : initJoinComposable}>
            Join Pool
          </Button>
        </div>
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
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Addresses
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                {poolType === "ComposableStable" ? "Protocol Fee Exempt?" : "Token Weights"}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Rate Providers
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Approvals
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Amounts
              </Typography>
            </Grid>

            {rows.map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <Grid item xs={3}>
                  <TextField
                    label={`Token Address ${rowIndex + 1}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}
                    value={tokenAddresses[rowIndex]}
                    onChange={(event) => handleInputChange(event, rowIndex, setTokenAddresses)}
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
                <Grid item xs={2}>
                  {poolType === "Weighted" ? (
                    <TextField
                      label={`Token Weight ${rowIndex + 1}`}
                      value={tokenWeights[rowIndex]}
                      onChange={(event) => handleInputChange(event, rowIndex, setTokenWeights)}
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
                  ) : (
                    <ButtonGroup color="primary" variant="contained" fullWidth aria-label={`Yield Protocol Fee Exempt? ${rowIndex + 1}`}>
                      <Button onClick={() => handleButtonClick(rowIndex, setYieldProtocolFeeExempt, true)} variant={yieldProtocolFeeExempt[rowIndex] ? "contained" : "outlined"}>
                        True
                      </Button>
                      <Button onClick={() => handleButtonClick(rowIndex, setYieldProtocolFeeExempt, false)} variant={yieldProtocolFeeExempt[rowIndex] ? "outlined" : "contained"}>
                        False
                      </Button>
                    </ButtonGroup>
                  )}
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    label={`Rate Provider ${rowIndex + 1}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}
                    value={rateProviders[rowIndex]}
                    onChange={(event) => handleInputChange(event, rowIndex, setRateProviders)}
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
                <Grid item xs={2} container alignItems="center">
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={approvedTokens[rowIndex]}
                    onClick={() => handleApprovalClick(tokenAddresses[rowIndex], vaultAddress, rowIndex)}
                  >
                    {approvedTokens[rowIndex] ? "Token Approved" : `Approve Token ${rowIndex + 1}`}
                  </Button>
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label={`Token Amount ${rowIndex + 1}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}
                    value={tokenAmounts[rowIndex]}
                    onChange={(event) => handleTokenAmountChange(event, rowIndex)}
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
              </React.Fragment>
            ))}
          </Grid>
        </Container>
      </Box>
      <br />
      <br />
      <br />
      <footer className="footer">
        open source project created by&nbsp;
        <a href="https://twitter.com/The_Krake" target="_blank" rel="noopener noreferrer">
          @ZeKraken
        </a>
        &nbsp;:&nbsp;
        <a href="https://github.com/zekraken-bot/pool_creator" target="_blank" rel="noopener noreferrer">
          github link
        </a>
      </footer>
      <br />
    </>
  );
}

export default App;
