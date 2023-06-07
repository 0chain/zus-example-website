# Züs Example Website

## Setting up the project:

1. Install Docker for Windows, Mac or Linux from [here](https://docs.docker.com/engine/install/).

2. Clone the repo

```
git clone https://github.com/0chain/zus-example-website
```

3. Navigate to the `docker.local` directory and run this command:

```
docker-compose -f docker-compose-dev.yaml up -d
```

4. Open `localhost:3008` in your browser to see the sample website

## Guide to transform website using [Zus SDK](https://www.npmjs.com/package/@zerochain/zus-sdk)

We will go through how we're downloading assets from allocations on ZÜS and using them on this sample website. This can be used as a guide to transform any website using zus-js-sdk

#### Prequisites

- `authTicket` of the directory the assets are stored in
- `zus-js-sdk`, instructions on how to setup it up can be found [here](https://github.com/0chain/zus-js-sdk#installation)

The following functions from `zus-js-sdk` are used in this transformation:

```
import {
    init,
    createWallet,
    download,
    setWallet,
    decodeAuthTicket,
    listSharedFiles,
} from "@zerochain/zus-sdk";
```

### Steps:

1. Create a script file and add it to your `html` file, inside `head` tag, with `priority` set to `high`, all the code in next steps would be placed inside this script

```
script src="assets.js" fetchpriority="high"></script>
```

2. Initialize `gosdk` with default config:

```
  const configJson = {
      chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
      signatureScheme: "bls0chain",
      minConfirmation: 50,
      minSubmit: 50,
      confirmationChainLength: 3,
      blockWorker: "https://demo.zus.network/dns",
      zboxHost: "https://0box.demo.zus.network"
  };
  const config = [
      configJson.chainId,
      configJson.blockWorker,
      configJson.signatureScheme,
      configJson.minConfirmation,
      configJson.minSubmit,
      configJson.confirmationChainLength,
      configJson.zboxHost,
      configJson.zboxAppType,
  ];

  await init(config);
```

3. Create a service wallet

```
    const { keys, mnemonic } = await createWallet();
    const { walletId, privateKey, publicKey } = keys

```

4. Set wallet on wasm

```
await setWallet(walletId, privateKey, publicKey, mnemonic);
```

5. Decode `authTicket` to get `path_hash`, `allocation_id` and `owner_id`

```
const authData = await decodeAuthTicket(authTicket)
```

6. Get the list of files inside this directory

```
const { data } = await listSharedFiles(authData?.file_path_hash, authData?.allocation_id, authData?.owner_id)
```

7. Loop over each file from the list to download it and set `src` on required DOM element to `url` in response

```
  for (let file = 0; file < filesList.length; file++) {
      const fileDetails = filesList[file]
      const downloadedFile = await download(
          fileDetails?.allocation_id,
          '',
          authTicket,
          fileDetails?.lookup_hash,
          false,
          100,
          '',
      );
      document.getElementById("my-image").src = downloadedFile?.url
  }
```

### Edit the Website

You can start editing the website by modifying src/index.js. Once the modification is done, Build the website and start the website as done above.
For detailed description of code check this [guide](https://docs.zus.network/guides/zus-js-sdk/js-sdk-sample-website/describing-code) on gitbook.

#### Common Terms

Here are some common terms used in our code and the 0chain blockchain:

- **Blobber**: A blobber is a storage provider that stores files on behalf of users. Blobbers are paid in ZCN tokens for storing and serving files.
- **Allocation**: An allocation is a group of blobbers used to store files. It defines storage and payment parameters and is paid in ZCN tokens.
- **Miners**: Miners are the nodes that run the 0chain blockchain and are rewarded in ZCN tokens.
- **Sharders**: Sharders are the nodes that run the 0chain blockchain and are rewarded in ZCN tokens.
- **Wallet**: A wallet is a collection of keys used to sign transactions. It is used for blobbers, miners, sharders, and users.
- **ZCN**: ZCN is the token used to pay miners, sharders, blobbers, and users.
- **ERC20**: ERC20 is the token format used by ZCN and Ethereum.
- **Public Key**: A public key is used to verify a signature and transactions.
- **Private Key**: A private key is used to sign transactions.
- **Signature**: A signature verifies that a transaction was signed by a private key.
- **Mnemonics**: Mnemonics are a set of words used to generate a wallet for a user.

### Hackathon Discord Link

Join our Hackathon Discord community for support and discussions:

https://discord.gg/7JSzwpcK55
