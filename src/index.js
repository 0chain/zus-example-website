import {
  init,
  setWallet,
  Greeter,
  listAllocations,
  createAllocation,
  getBalance,
  getBalanceWasm,
  bulkUpload,
  getFaucetToken,
  sendToken,
} from "zus-sdk";

import { get, onClick } from "./dom";

const getWallet = () => {
  const clientID = get("clientId").value;
  const publicKey = get("publicKey").value;
  const privateKey = get("privateKey").value;
  return {
    clientID,
    privateKey,
    publicKey,
  };
};

const configJson = {
  chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
  signatureScheme: "bls0chain",
  minConfirmation: 50,
  minSubmit: 50,
  confirmationChainLength: 3,
  blockWorker: "https://dev.0chain.net/dns",
  zboxHost: "https://0box.dev.0chain.net",
  zboxAppType: "vult",
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
//const bls = window.bls;
// let goWasm;
// createWasm().then(async (wasm) => {
//   await wasm.sdk.init(...config);
//   await bls.init(bls.BN254);
//   const { clientID, privateKey, publicKey } = getWallet();
//   console.log({ clientID, privateKey, publicKey });
//   await wasm.setWallet(bls, clientID, privateKey, publicKey);

//   goWasm = wasm;
// });

/*
  const loadData = async () => {
    const wasm = await createWasm();

    console.log("wasm", wasm);

    await wasm.sdk.showLogs();

    //console.log(...config);
    // await wasm.sdk.init(...config);
    await wasm.sdk.init(
      config.chainId,
      config.blockWorker,
      config.signatureScheme,
      config.minConfirmation,
      config.minSubmit,
      config.confirmationChainLength,
      config.zboxHost,
      config.zboxAppType
    );

    console.log("bls", bls);
    await bls.init(bls.BN254);

    // const testWallet = {
    //   clientId:
    //     "7d35a6c3ba5066e62989d34cee7dd434d0833d5ea9ff00928aa89994d80e4700",
    //   privateKey:
    //     "5ababb1e99fe08e44b9843a0a365a832928f9e1aa2d6bba24e01058f1bf0e813",
    //   publicKey:
    //     "5b7ce801f11b5ce02c2ff980469b00e7ed34a9690977661b0cc80bc5eb33ee13baaf6b099f38a2586c5ff63c576870829c117e392fc40868e4bd6418dbaf389c",
    // };
    // await wasm.setWallet(
    //   bls,
    //   testWallet.clientId,
    //   testWallet.privateKey,
    //   testWallet.publicKey
    // );

    goWasm = wasm;
  };*/

const bindEvents = () => {
  console.log("bindEvents");

  onClick("btnInit", async () => {
    console.log("calling init");
    //Initialize SDK
    await init(config);
  });

  onClick("btnSetWallet", async () => {
    const { clientID, privateKey, publicKey } = getWallet();
    await setWallet(clientID, privateKey, publicKey);
  });

  onClick("btnSendMeTokens", async () => {
    await getFaucetToken();
  });

  onClick("btnGetBalance", async () => {
    const { clientID } = getWallet();
    const wallet = await getBalanceWasm(clientID);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
  });

  const log = console.log;
  const logs = get("logs");
  onClick("btnShowLogs", async () => {
    await goWasm.sdk.showLogs();
    console.log = (s) => {
      log(s);
      logs.value += s;
      logs.scrollLeft = 0;
      logs.scrollTop = logs.scrollHeight;
    };
  });

  onClick("btnHideLogs", async () => {
    await goWasm.sdk.hideLogs();
    console.log = log;
  });
};

window.onload = bindEvents;
