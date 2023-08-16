# Züs Example Website
[Züs](https://zus.network/) is a high-performance cloud on a fast blockchain offering privacy and configurable uptime. It is an alternative to traditional cloud S3 and has shown better performance on a test network due to its parallel data architecture. The technology uses erasure code to distribute the data between data and parity servers. Züs storage is configurable to provide flexibility for IT managers to design for desired security and uptime, and can design a hybrid or a multi-cloud architecture with a few clicks using [Blimp's](https://blimp.software/) workflow, and can change redundancy and providers on the fly.

For instance, the user can start with 10 data and 5 parity providers and select where they are located globally, and later decide to add a provider on-the-fly to increase resilience, performance, or switch to a lower cost provider.

Users can also add their own servers to the network to operate in a hybrid cloud architecture. Such flexibility allows the user to improve their regulatory, content distribution, and security requirements with a true multi-cloud architecture. Users can also construct a private cloud with all of their own servers rented across the globe to have a better content distribution, highly available network, higher performance, and lower cost.

[The QoS protocol](https://medium.com/0chain/qos-protocol-weekly-debrief-april-12-2023-44524924381f) is time-based where the blockchain challenges a provider on a file that the provider must respond within a certain time based on its size to pass. This forces the provider to have a good server and data center performance to earn rewards and income.

The [privacy protocol](https://zus.network/build) from Züs is unique where a user can easily share their encrypted data with their business partners, friends, and family through a proxy key sharing protocol, where the key is given to the providers, and they re-encrypt the data using the proxy key so that only the recipient can decrypt it with their private key.

Züs has ecosystem apps to encourage traditional storage consumption such as [Blimp](https://blimp.software/), a S3 server and cloud migration platform, and [Vult](https://vult.network/), a personal cloud app to store encrypted data and share privately with friends and family, and [Chalk](https://chalk.software/), a high-performance story-telling storage solution for NFT artists.

Other apps are [Bolt](https://bolt.holdings/), a wallet that is very secure with air-gapped 2FA split-key protocol to prevent hacks from compromising your digital assets, and it enables you to stake and earn from the storage providers; [Atlus](https://atlus.cloud/), a blockchain explorer and [Chimney](https://demo.chimney.software/), which allows anyone to join the network and earn using their server or by just renting one, with no prior knowledge required.

### Preview

See the Live Preview here: https://dev-zus-website.zus.network

<div align="center">
 
  https://www.loom.com/share/10c4d98ac942498a8a29df4d67c70cf8
    
</div>

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
    1. Signup for Blimp if you haven't already [here](https://blimp.software/authentication/login)
    2. Create an allocation, create a directory and upload your assets to it
    3. Use `share` option from folder options menu to get your `authTicket`
- `zus-js-sdk`, instructions on how to setup it up as an npm package can be found [here](https://github.com/0chain/zus-js-sdk#installation)
- latest build of `wasm`(goSdk), placed in the same dicrectory as your app's entrypoint, in most cases it would be the `public` or `dist` directory. You can get the latest build of wasm from the first action on [this](https://github.com/0chain/gosdk/actions/workflows/sdk-release.yml?query=branch%3Astaging) page

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

All the transformation described below has been done in [this script](src/assets.js). Feel free to use it as reference.

### Steps:

1. Add these two scripts to the `head` of your entrypoint `html` file. These are required by `wasm` for it's operations 
```
    <script src="https://cdn.jsdelivr.net/gh/herumi/bls-wasm@v1.0.0/browser/bls.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/golang/go@go1.18.5/misc/wasm/wasm_exec.js"></script>
```

2. Create a script file and add it to your entrypoint `html` file, all the code in next steps would be placed inside this script

```
script src="assets.js" fetchpriority="high"></script>
```

3. Initialize `wasm` with default config:

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

4. Create a service wallet

```
    const { keys, mnemonic } = await createWallet();
    const { walletId, privateKey, publicKey } = keys
```

5. Set wallet on wasm

```
await setWallet(walletId, privateKey, publicKey, mnemonic);
```

6. Decode `authTicket` to get `path_hash`, `allocation_id` and `owner_id`

```
const authData = await decodeAuthTicket(authTicket)
```

7. Get the list of files inside this directory

```
const { data } = await listSharedFiles(authData?.file_path_hash, authData?.allocation_id, authData?.owner_id)
```

8. Loop over each file from the list to download it and set `src` on required DOM element to `url` in response

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

9. Cache the asset in `indexedDB` to use on page reload
```
function createStore(dbName, storeName) {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    const dbp = promisifyRequest(request);

    return (txMode, callback) =>
        dbp.then((db) =>
            callback(db.transaction(storeName, txMode).objectStore(storeName)),
        );
}

function setValue(key, value, customStore = getDefaultStore()) {
    return customStore('readwrite', (store) => {
        store.put(value, key);
        return promisifyRequest(store.transaction);
    });
}

function getDefaultStore() {
    if (!defaultGetStoreFunc) {
        defaultGetStoreFunc = createStore('zus-assets-store', 'zus-assets');
    }
    return defaultGetStoreFunc;
}

function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.oncomplete = request.onsuccess = () => resolve(request.result);
        request.onabort = request.onerror = () => reject(request.error);
    });
}
```

### Edit the Website

You can start editing the website by modifying [assets.js](src/assets.js) and [index.html](dist/index.html). Once the modification is done, Build the website and start the website as done above.
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
