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

import { get, onClick, setHtml } from "./dom";

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

const bindEvents = () => {
  console.log("bindEvents");

  onClick("btnGreet", async () => {
    console.log("calling Greet");
    //Call Greeter method
    const greetMessage = Greeter("john doe");
    console.log("greetMessage", greetMessage);
    setHtml("message", greetMessage);
  });

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

  onClick("btnListAllocations", async () => {
    //Call listAllocations method
    const allocations = await listAllocations();
    console.log("allocations", allocations);
    let allocationListHtml = "";
    allocations.map((allocation, index) => {
      allocationListHtml += `
    <div key={index}>
    <input
      type="radio"
      name="selectedAllocation"
      value=${allocation.id}
      onClick="selectAllocation('${allocation.id}')"
    />
    <label htmlFor=${allocation.id}>
      Allocation: ${allocation.id}
    </label>
    <br></br>
  </div>`;
    });
    setHtml("listAllocations", allocationListHtml);

    const selectAllocation = (allocationId) => {
      console.log("selected allocation", allocationId);
    };
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
