import "./App.css";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { Grid, TextField, Button, Select, MenuItem, Container, Box, ButtonGroup } from "@mui/material";

import { ethers } from "ethers";

import { CreateWeightedABI } from "./abi/WeightedPoolFactory";
import { weightedPool } from "./abi/WeightedPool";
import { CreateComposableABI } from "./abi/ComposableStableFactory";
import { composablePool } from "./abi/ComposablePool";
import { ERC20 } from "./abi/erc20";
import { vaultABI } from "./abi/BalVault";

function App() {
  const FactoryAddressWeighted = {
    Mainnet: "0x897888115Ada5773E02aA29F775430BFB5F34c51",
    Polygon: "0xFc8a407Bba312ac761D8BFe04CE1201904842B76",
    Arbitrum: "0xc7E5ED1054A24Ef31D827E6F86caA58B3Bc168d7",
    Gnosis: "0x6CaD2ea22BFA7F4C14Aae92E47F510Cd5C509bc7",
    zkEVM: "0x03F3Fb107e74F2EAC9358862E91ad3c692712054",
    Avalanche: "0x230a59F4d9ADc147480f03B0D3fFfeCd56c3289a",
    Base: "0x4C32a8a8fDa4E24139B51b456B42290f51d6A1c4",
    Optimism: "0x230a59F4d9ADc147480f03B0D3fFfeCd56c3289a",
    Fraxtal: "0x9dA18982a33FD0c7051B19F0d7C76F2d5E7e017c",
    Mode: "0xc3ccacE87f6d3A81724075ADcb5ddd85a8A1bB68",
    Sepolia: "0x7920BFa1b2041911b354747CA7A6cDD2dfC50Cfd",
  };
  const FactoryAddressComposable = {
    Mainnet: "0x5B42eC6D40f7B7965BE5308c70e2603c0281C1E9",
    Polygon: "0xEAedc32a51c510d35ebC11088fD5fF2b47aACF2E",
    Arbitrum: "0x4bdCc2fb18AEb9e2d281b0278D946445070EAda7",
    Gnosis: "0x47B489bf5836f83ABD928C316F8e39bC0587B020",
    zkEVM: "0xf23b4DB826DbA14c0e857029dfF076b1c0264843",
    Avalanche: "0xb9F8AB3ED3F3aCBa64Bc6cd2DcA74B7F38fD7B88",
    Base: "0x956CCab09898C0AF2aCa5e6C229c3aD4E93d9288",
    Optimism: "0x4bdCc2fb18AEb9e2d281b0278D946445070EAda7",
    Fraxtal: "0x4bdCc2fb18AEb9e2d281b0278D946445070EAda7",
    Mode: "0x5DbAd78818D4c8958EfF2d5b95b28385A22113Cd",
    Sepolia: "0x05503B3aDE04aCA81c8D6F88eCB73Ba156982D2B",
  };
  const [walletAddress, setWalletAddress] = useState("");
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [network, setNetwork] = useState("");
  const [poolName, setPoolName] = useState("");
  const [poolSymbol, setPoolSymbol] = useState("");
  const [swapFeePercentage, setSwapFeePercentage] = useState("");
  const [amplificationFactor, setAmplificationFactor] = useState("");
  const [rateCacheDuration, setRateCacheDuration] = useState("");
  const [yieldProtocolFeeExempt, setYieldProtocolFeeExempt] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b");
  const [poolId, setPoolId] = useState("");
  const [poolContract, setPoolContract] = useState("");
  const [poolType, setPoolType] = useState("weighted");
  const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

  const [rows, setRows] = useState([]);
  const [tokenAddresses, setTokenAddresses] = useState([]);
  const [tokenWeights, setTokenWeights] = useState([]);
  const [rateProviders, setRateProviders] = useState([]);
  const [tokenAmounts, setTokenAmounts] = useState([]);
  const [approvedTokens, setApprovedTokens] = useState([]);

  const [generatedLink, setGeneratedLink] = useState("");

  const defaultRateProvider = "0x0000000000000000000000000000000000000000";

  const handleButtonClick = (value) => {
    setYieldProtocolFeeExempt(value);
  };

  const handleInputChange = (event, rowIndex, setter) => {
    const newValue = event.target.value;
    setter((prevState) => {
      const newState = [...prevState];
      newState[rowIndex] = newValue;
      return newState;
    });
  };

  function generatePoolCreationLink() {
    //const baseUrl = "http://localhost:3000/";
    const baseUrl = "https://pool-creator.web.app/";
    let queryParams;
    if (poolType === "weighted") {
      queryParams = new URLSearchParams({
        pooltypes: poolType,
        name: poolName,
        symbol: poolSymbol,
        swapfee: swapFeePercentage,
        addresses: tokenAddresses.join(","),
        weights: tokenWeights.join(","),
        rateprovider: rateProviders.join(","),
        amounts: tokenAmounts.join(","),
      }).toString();
    } else if (poolType === "composablestable") {
      queryParams = new URLSearchParams({
        pooltypes: poolType,
        name: poolName,
        symbol: poolSymbol,
        swapfee: swapFeePercentage,
        amplification: amplificationFactor,
        rateduration: rateCacheDuration,
        yieldexempt: yieldProtocolFeeExempt,
        addresses: tokenAddresses.join(","),
        rateprovider: rateProviders.join(","),
        amounts: tokenAmounts.join(","),
      }).toString();
    }

    const fullUrl = `${baseUrl}?${queryParams}`;
    return fullUrl;
  }

  const handleCreateLinkClick = () => {
    const link = generatePoolCreationLink();
    setGeneratedLink(link);
    navigator.clipboard.writeText(link).then(
      () => {
        alert("Link copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  useEffect(() => {
    const numRows = poolType === "weighted" ? 8 : poolType === "composablestable" ? 5 : 0;

    setRows(new Array(numRows).fill(null));
    setApprovedTokens(new Array(numRows).fill(false));
    setRateProviders((prev) => Array.from({ length: numRows }, (_, i) => prev[i] || defaultRateProvider));

    const params = new URLSearchParams(window.location.search);
    const pooltypesParam = params.get("pooltypes");
    const poolnameParam = params.get("name");
    const poolsymbolParam = params.get("symbol");
    const swapfeeParam = params.get("swapfee");
    const addressesParam = params.get("addresses");
    const weightsParam = params.get("weights");
    const rateproviderParam = params.get("rateprovider");
    const tokenamountParam = params.get("amounts");
    const amplification = params.get("amplification");
    const rateduration = params.get("rateduration");
    const yieldexempt = params.get("yieldexempt");

    let addresses = [];
    let weights = [];
    let rateprovider = [];
    let tokenamount = [];

    if (pooltypesParam) {
      const formattedPoolType = pooltypesParam.toLowerCase() === "weighted" ? "weighted" : pooltypesParam.toLowerCase() === "composablestable" ? "composablestable" : null;
      if (formattedPoolType) {
        setPoolType(formattedPoolType);
      }
    }

    if (addressesParam) {
      addresses = addressesParam.split(",");
    }
    if (weightsParam) {
      weights = weightsParam.split(",");
    }
    if (rateproviderParam) {
      rateprovider = rateproviderParam.split(",");
    }
    if (tokenamountParam) {
      tokenamount = tokenamountParam.split(",");
    }

    const tokenAddresses = addresses.length > 0 ? addresses.concat(new Array(numRows - addresses.length).fill("")) : new Array(numRows).fill("");
    const tokenWeights = weights.length > 0 ? weights.concat(new Array(numRows - weights.length).fill("")) : new Array(numRows).fill("");
    const tokenRateProvider = rateprovider.length > 0 ? rateprovider.concat(new Array(numRows - rateprovider.length).fill("")) : new Array(numRows).fill("");
    const tokenAmounts = tokenamount.length > 0 ? tokenamount.concat(new Array(numRows - tokenamount.length).fill("")) : new Array(numRows).fill("");

    if (pooltypesParam === "weighted") {
      setPoolName(poolnameParam);
      setPoolSymbol(poolsymbolParam);
      setSwapFeePercentage(swapfeeParam);
      setTokenAddresses(tokenAddresses);
      setTokenWeights(tokenWeights);
      setRateProviders(tokenRateProvider);
      setTokenAmounts(tokenAmounts);
    } else if (pooltypesParam === "composablestable") {
      setPoolName(poolnameParam);
      setPoolSymbol(poolsymbolParam);
      setSwapFeePercentage(swapfeeParam);
      setTokenAddresses(tokenAddresses);
      setRateProviders(tokenRateProvider);
      setTokenAmounts(tokenAmounts);
      setAmplificationFactor(amplification);
      setRateCacheDuration(rateduration);
      setYieldProtocolFeeExempt(yieldexempt);
    }

    const ethereum = window.ethereum || window.ethereumProvider;
    if (ethereum) {
      async function checkWalletonLoad() {
        const accounts = await ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length) {
          const networkId = await ethereum.request({
            method: "net_version",
          });

          setNetwork(getNetworkName(networkId));
          console.log("Your wallet is connected");
          const ethaddress = accounts[0];
          setWalletAddress(ethaddress);
          setButtonText("Wallet Connected");
        } else {
          console.log("Wallet is not connected");
        }
      }
      async function updateNetwork() {
        const networkId = await ethereum.request({
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

      ethereum.on("chainChanged", onChainChanged);
      ethereum.on("accountsChanged", onAccountsChanged);

      checkWalletonLoad();

      return () => {
        ethereum.removeListener("chainChanged", onChainChanged);
        ethereum.removeListener("accountsChanged", onAccountsChanged);
      };
    } else {
      console.log("Wallet not detected");
    }
  }, [poolType]);

  function getNetworkName(networkId) {
    const id = String(networkId);
    switch (id) {
      case "1":
        return "Mainnet";
      case "10":
        return "Optimism";
      case "137":
        return "Polygon";
      case "42161":
        return "Arbitrum";
      case "100":
        return "Gnosis";
      case "1101":
        return "zkEVM";
      case "43114":
        return "Avalanche";
      case "8453":
        return "Base";
      case "34443":
        return "Mode";
      case "252":
        return "Fraxtal";
      case "11155111":
        return "Sepolia";
      default:
        return "Unknown network";
    }
  }

  async function requestAccount() {
    const ethereum = window.ethereum || window.ethereumProvider;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const ethaddress = accounts[0];
        setWalletAddress(ethaddress);
        setButtonText("Wallet Connected");
      } catch (error) {
        console.log("Error connecting...");
      }
    } else {
      console.log("Wallet not detected");
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

    // only keep non-blank token addresses
    let filteredTokens = tokenAddresses.filter((token) => token !== "");

    const filteredWeights = tokenWeights.filter((weight) => weight !== "");
    let weights = filteredWeights.map((weight) => ethers.utils.parseUnits((weight / 100).toString(), 18));

    // fill rateProviders with the default value if token address rows are blank
    let filteredRateProviders = rateProviders.map((rateProvider) => (rateProvider && rateProvider.trim() !== "" ? rateProvider : defaultRateProvider));

    // Sort token addresses in ascending order and regenerate the other arrays in this new order
    const tokenMap = {};
    filteredTokens.forEach((token, index) => {
      tokenMap[token] = { weight: weights[index], rateProvider: filteredRateProviders[index] };
    });

    filteredTokens = Object.keys(tokenMap).sort((a, b) => {
      return ethers.BigNumber.from(a).lt(ethers.BigNumber.from(b)) ? -1 : 1;
    });

    weights = filteredTokens.map((token) => tokenMap[token].weight);
    filteredRateProviders = filteredTokens.map((token) => tokenMap[token].rateProvider);

    // convert swap fee to ethers format
    const swapFeePercentageWithDecimals = ethers.utils.parseUnits(swapFeePercentage.toString(), 18);

    // create random salt value
    const salt = [...crypto.getRandomValues(new Uint8Array(32))].map((m) => ("0" + m.toString(16)).slice(-2)).join("");

    const salt0x = "0x" + salt;

    console.log(poolName, poolSymbol, filteredTokens, weights, filteredRateProviders, swapFeePercentageWithDecimals, ownerAddress, salt0x);

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

    // only keep non-blank token addresses
    let filteredTokens = tokenAddresses.filter((token) => token !== "");

    // fill rateProviders with the default value if token address rows are blank
    let filteredRateProviders = rateProviders.map((rateProvider) => (rateProvider && rateProvider.trim() !== "" ? rateProvider : defaultRateProvider));

    // Sort token addresses in ascending order and regenerate the other arrays in this new order
    const tokenMap = {};
    filteredTokens.forEach((token, index) => {
      tokenMap[token] = { rateProvider: filteredRateProviders[index] };
    });

    filteredTokens = Object.keys(tokenMap).sort((a, b) => {
      return ethers.BigNumber.from(a).lt(ethers.BigNumber.from(b)) ? -1 : 1;
    });

    filteredRateProviders = filteredTokens.map((token) => tokenMap[token].rateProvider);

    // add rate durations for every row there is a token address
    const rateCacheDurations = Array.from({ length: tokenAddresses.filter((address) => address !== "").length }, (_, index) => rateCacheDuration);

    // convert swap fee to ethers format
    const swapFeePercentageWithDecimals = ethers.utils.parseUnits(swapFeePercentage.toString(), 18);

    // create random salt value
    const salt = [...crypto.getRandomValues(new Uint8Array(32))].map((m) => ("0" + m.toString(16)).slice(-2)).join("");

    const salt0x = "0x" + salt;

    console.log(
      poolName,
      poolSymbol,
      filteredTokens,
      amplificationFactor,
      filteredRateProviders,
      rateCacheDurations,
      yieldProtocolFeeExempt,
      swapFeePercentageWithDecimals,
      ownerAddress,
      salt0x
    );

    const transaction = await ethcontract.create(
      poolName,
      poolSymbol,
      filteredTokens,
      amplificationFactor,
      filteredRateProviders,
      rateCacheDurations,
      yieldProtocolFeeExempt,
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
    linkedItems.sort((a, b) => (ethers.BigNumber.from(a[0]).lt(ethers.BigNumber.from(b[0])) ? -1 : 1));

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
    linkedItems.sort((a, b) => (ethers.BigNumber.from(a[0]).lt(ethers.BigNumber.from(b[0])) ? -1 : 1));

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
    poolType === "composablestable" && {
      label: "Amplification Factor\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "amplificationFactor",
      value: amplificationFactor,
      onChange: setAmplificationFactor,
    },
    poolType === "composablestable" && {
      label: "Rate Cache Duration\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "rateCacheDuration",
      value: rateCacheDuration,
      onChange: setRateCacheDuration,
    },
    poolType === "composablestable" && {
      id: "yieldProtocolFeeExempt",
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
    poolType === "composablestable" && {
      label: "Pool Contract\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0",
      id: "poolContract",
      value: poolContract,
      onChange: setPoolContract,
    },
  ]
    .filter(Boolean)
    .map(({ label, id, value, onChange }, index) => (
      <Grid item xs={8} key={index} sx={{ padding: "6px" }}>
        {id === "yieldProtocolFeeExempt" ? (
          <React.Fragment>
            <Typography variant="body1" component="div" gutterBottom style={{ color: "white" }}>
              Yield Protocol Fee Exempt?
            </Typography>
            <ButtonGroup color="primary" variant="contained" fullWidth aria-label="Yield Protocol Fee Exempt?" sx={{ mb: 1 }}>
              <Button onClick={() => handleButtonClick(true)} variant={yieldProtocolFeeExempt ? "contained" : "outlined"}>
                True
              </Button>
              <Button onClick={() => handleButtonClick(false)} variant={!yieldProtocolFeeExempt ? "contained" : "outlined"}>
                False
              </Button>
            </ButtonGroup>
          </React.Fragment>
        ) : (
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
        )}
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
              <MenuItem value="weighted">Weighted</MenuItem>
              <MenuItem value="composablestable">ComposableStable</MenuItem>
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
            {poolType === "weighted" ? (
              <>
                <strong>
                  <span style={{ color: "red", fontSize: "16px" }}>**Please read each tip before proceeding**</span>
                </strong>
                <br />
                <br />
                <strong>
                  <u>Usage Tips for Weighted:</u>
                </strong>
                <li>swap fee percentage should be entered as 0.01 if you want 1%</li>
                <li>token weights should be entered as 80 if you want 80% or 50 if you want 50%</li>
                <li>if you need to create equal weighted pool such as 33.33/33.33/33.34, make sure to use 9 digits, 33.3333333/33.3333333/33.3333334 for example</li>
                <li>if you do not have a rate provider, the zero address will be used</li>
                <li>token amounts should be entered in number of tokens you want to deposit, 0.001 ETH for that much ETH</li>
                <li>
                  pool id automatically populates when the pool contract is created; pool id field can be used to perform the 'init join' tx separately (can find pool id on the
                  etherscan contract)
                </li>
              </>
            ) : (
              <>
                <strong>
                  <span style={{ color: "red", fontSize: "16px" }}>**Please read each tip before proceeding**</span>
                </strong>
                <br />
                <br />
                <strong>
                  <u>Usage Tips for ComposableStable:</u>
                </strong>
                <li>swap fee percentage should be entered as 0.01 if you want 1%</li>
                <li>protocol fee exempt is set to false by default</li>
                <li>if you do not have a rate provider, the zero address will be used</li>
                <li>token amounts should be entered in number of tokens you want to deposit, 0.001 ETH for that much ETH</li>
                <li>
                  pool id automatically populates when the pool contract is created; pool id field can be used to perform the 'init join' tx separately (can find pool id on the
                  etherscan contract)
                </li>
              </>
            )}
          </ul>
        </div>
        <br />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button variant="contained" onClick={poolType === "weighted" ? createPoolWeighted : createPoolComposable} sx={{ marginRight: 2 }}>
            Create Pool
          </Button>
          <Button variant="contained" onClick={poolType === "weighted" ? initJoinWeighted : initJoinComposable}>
            Join Pool
          </Button>
          <Button variant="contained" onClick={handleCreateLinkClick} sx={{ marginLeft: 2 }}>
            Create Pre-Filled URL
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
            {poolType === "weighted" && (
              <Grid item xs={2}>
                <Typography variant="h6" sx={{ color: "pink" }}>
                  Token Weights
                </Typography>
              </Grid>
            )}
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
                {poolType === "weighted" && (
                  <Grid item xs={2}>
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
                  </Grid>
                )}
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
      {generatedLink && (
        <div style={{ display: "flex", flexDirection: "column", wordWrap: "break-word", maxWidth: "80%", color: "lightgray", marginLeft: "20px" }}>
          <span style={{ fontWeight: "bold", textDecoration: "underline" }}>URL Link to pre-filled choices:</span> {generatedLink}
        </div>
      )}
      <br />
      <br />
      <footer className="footer">
        created by&nbsp;
        <a href="https://twitter.com/The_Krake" target="_blank" rel="noopener noreferrer">
          @ZeKraken
        </a>
        &nbsp;| open source: &nbsp;
        <a href="https://github.com/zekraken-bot/veBAL_Multi_Voter" target="_blank" rel="noopener noreferrer">
          github
        </a>
        &nbsp;|&nbsp;Disclaimer: use at your discretion, I take no responsiblity for results
      </footer>
      <br />
    </>
  );
}

export default App;
