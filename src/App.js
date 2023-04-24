import "./App.css";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Grid, TextField, Button } from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { CreateABI } from "./abi/WeightedPoolFactory";
import { ERC20 } from "./abi/erc20";
import { vaultABI } from "./abi/BalVault";
import { weightedPool } from "./abi/WeightedPool";
import { isAddress } from "ethers/lib/utils";

function App() {
  const FactoryAddress = {
    Goerli: "0x230a59f4d9adc147480f03b0d3fffecd56c3289a",
    Mainnet: "0x897888115Ada5773E02aA29F775430BFB5F34c51",
    Polygon: "0xFc8a407Bba312ac761D8BFe04CE1201904842B76",
    Arbitrum: "0xc7E5ED1054A24Ef31D827E6F86caA58B3Bc168d7",
  };
  const [walletAddress, setWalletAddress] = useState();
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [network, setNetwork] = useState();
  const [poolName, setPoolName] = useState();
  const [poolSymbol, setPoolSymbol] = useState();
  const [swapFeePercentage, setSwapFeePercentage] = useState();
  const [ownerAddress, setOwnerAddress] = useState(
    "0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b"
  );
  const [approvedTokens, setApprovedTokens] = useState(
    new Array(8).fill(false)
  );
  const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

  const rows = new Array(8).fill(null);
  const [tokenAddresses, setTokenAddresses] = useState(new Array(8).fill(""));
  const [tokenWeights, setTokenWeights] = useState(new Array(8).fill(""));
  const [rateProviders, setRateProviders] = useState(new Array(8).fill(""));
  const [tokenAmounts, setTokenAmounts] = useState(new Array(8).fill(""));
  const [poolId, setPoolId] = useState();
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
  }, []);

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

  async function checkApprovedTokens(updatedTokenAddresses) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const newApprovedTokens = [...approvedTokens];
    const amountToApprove = ethers.constants.MaxUint256;
    for (let i = 0; i < updatedTokenAddresses.length; i++) {
      const tokenAddress = updatedTokenAddresses[i];
      if (!tokenAddress) {
        newApprovedTokens[i] = false;
        continue;
      }
      const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
      const approvedAmount = await tokenContract.allowance(
        walletAddress,
        vaultAddress
      );
      newApprovedTokens[i] = approvedAmount.gte(amountToApprove);
    }
    setApprovedTokens(newApprovedTokens);
  }

  const handleTokenAddressChange = (event, index) => {
    const newTokenAddresses = [...tokenAddresses];
    newTokenAddresses[index] = event.target.value;
    setTokenAddresses(newTokenAddresses);

    const newApprovedTokens = [...approvedTokens];
    if (!isAddress(event.target.value)) {
      newApprovedTokens[index] = false;
    }
    setApprovedTokens(newApprovedTokens);

    if (isAddress(event.target.value)) {
      checkApprovedTokens(newTokenAddresses);
    }
  };

  async function createPool() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(
      FactoryAddress[network],
      CreateABI,
      signer
    );
    const gasoverride = { gasLimit: 6000000 };

    const filteredTokens = tokenAddresses.filter((token) => token !== "");
    const filteredWeights = tokenWeights.filter((weight) => weight !== "");

    // token address, token weights, rate providers
    const tokens = filteredTokens;
    const weights = filteredWeights.map((weight) =>
      ethers.utils.parseUnits((weight / 100).toString(), 18)
    );
    const defaultRateProvider = "0x0000000000000000000000000000000000000000";
    const filteredRateProviders = rateProviders.filter(
      (rateProvider) => rateProvider !== ""
    );
    const rateProvidersLength = tokens.length;

    // Fill rateProviders with the default value based on the length of tokens array
    for (let i = filteredRateProviders.length; i < rateProvidersLength; i++) {
      filteredRateProviders.push(defaultRateProvider);
    }

    const salt = [...crypto.getRandomValues(new Uint8Array(32))]
      .map((m) => ("0" + m.toString(16)).slice(-2))
      .join("");

    const salt0x = "0x" + salt;

    const swapFeePercentageWithDecimals = ethers.utils.parseUnits(
      swapFeePercentage.toString(),
      18
    );

    const transaction = await ethcontract.create(
      poolName,
      poolSymbol,
      tokens,
      weights,
      filteredRateProviders,
      swapFeePercentageWithDecimals,
      ownerAddress,
      salt0x,
      gasoverride
    );
    const receipt = await transaction.wait();
    const newPoolContract = receipt.logs[0].address;

    const ethcontract2 = new ethers.Contract(
      newPoolContract,
      weightedPool,
      signer
    );
    const getPoolId = await ethcontract2.getPoolId();

    setPoolId(getPoolId);
  }

  async function initJoin() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const ethcontract = new ethers.Contract(vaultAddress, vaultABI, signer);
    const gasoverride = { gasLimit: 6000000 };

    const assets = tokenAddresses.filter((address) => address !== "");
    const amountsIn = tokenAmounts.filter((amount) => amount !== "");

    const sortedAmountsIn = [];
    const multipliedAmounts = []; // new array to hold the multiplied amounts
    for (let i = 0; i < amountsIn.length; i++) {
      const tokenAddress = tokenAddresses[i];
      const amount = amountsIn[i];
      if (tokenAddress && amount) {
        const decimals = await checkDecimals(tokenAddress);
        const adjustedAmount = ethers.utils.parseUnits(amount, decimals);
        sortedAmountsIn.push(adjustedAmount.toString());
        multipliedAmounts.push(adjustedAmount);
      }
    }

    const linkedItems = assets.map((asset, index) => [
      asset,
      multipliedAmounts[index], // use the new array here
    ]);

    linkedItems.sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });

    const sortedAssets = linkedItems.map((item) => item[0]);
    const sortedAmountsIn2 = linkedItems.map((item) => item[1].toString());

    const JOIN_KIND_INIT = 0;

    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256[]"],
      [JOIN_KIND_INIT, sortedAmountsIn2]
    );

    const joinRequest = {
      assets: sortedAssets,
      maxAmountsIn: sortedAmountsIn2,
      userData,
      fromInternalBalance: false,
    };

    await ethcontract.joinPool(
      poolId,
      walletAddress,
      walletAddress,
      joinRequest,
      gasoverride
    );
  }

  const handleApprovalClick = async (tokenAddress, vaultAddress, index) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const gasLimit = 6000000;
    const amountToApprove = ethers.constants.MaxUint256;
    const tx = await tokenContract.approve(vaultAddress, amountToApprove, {
      gasLimit,
    });
    await tx.wait();
    setApprovedTokens((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  async function checkDecimals(tokenAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const decimals = await tokenContract.decimals();
    return decimals;
  }

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
        <p align="right">
          Wallet Address:{" "}
          {walletAddress &&
            `${walletAddress.substring(0, 6)}...${walletAddress.substring(
              walletAddress.length - 6
            )}`}
        </p>

        <p align="right">Network: {network}</p>
      </header>
      <br />
      <div className="mainContent">
        <Button
          variant="contained"
          onClick={createPool}
          sx={{ marginRight: 2 }} // Add right margin to the first button
        >
          Create Pool
        </Button>
        <Button variant="contained" onClick={initJoin}>
          Join Pool
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
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Addresses
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="h6" sx={{ color: "pink" }}>
                Token Weights
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
                    label={`Token Address ${rowIndex + 1}`}
                    value={tokenAddresses[rowIndex]}
                    onChange={(event) =>
                      handleTokenAddressChange(event, rowIndex)
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
                <Grid item xs={2}>
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
                <Grid item xs={2} container alignItems="center">
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={approvedTokens[rowIndex]}
                    onClick={() =>
                      handleApprovalClick(
                        tokenAddresses[rowIndex],
                        vaultAddress,
                        rowIndex
                      )
                    }
                  >
                    {approvedTokens[rowIndex]
                      ? "Token Approved"
                      : `Approve Token ${rowIndex + 1}`}
                  </Button>
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label={`Token Amount ${rowIndex + 1}`}
                    value={tokenAmounts[rowIndex]}
                    onChange={(event) =>
                      handleInputChange(event, rowIndex, setTokenAmounts)
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
