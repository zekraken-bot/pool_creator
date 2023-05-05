Usage Notes:

1. if a rate provider is not supplied, the 0x0000 address will be used
2. swap fee can be entered as 0.01 for 1%
3. token weights can be entered as 80/20, 50/50, etc. the appropriate values will be applied in the background
4. token amounts can be entered as the amount you want to supply, 0.001 ETH for example, the correct digits will be applied in the background
5. the main Balancer chains are supported [mainnet, polygon, arbitrum]; you will create a pool for the chain your wallet is connected to (so double check)
6. contract addresses for pool factories are manually maintained, so check that the latest contracts are being used
7. the pool id will fill in once the pool creation tx completes
8. you can input the pool id manually if you need to perform the init join (find pool address on the etherscan contract)

## Available Scripts

In the project directory run the following:

### `npm install`

Installs project depedencies, you will need `npm` installed as well as `Node.js`

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!
