import {
  init,
  setWallet,
  Greeter,
  listAllocations,
  createAllocation,
  getAllocation,
  getBalance,
  getBalanceWasm,
  bulkUpload,
  download,
  getFaucetToken,
  sendTransaction,
  listObjects,
} from "zus-sdk";

import { get, onClick, onClickGroup, setHtml, onChange } from "./dom";

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

const listAllocationsClick = async () => {
  //Call listAllocations method
  const allocations = await listAllocations();
  console.log("allocations", allocations);
  let allocationListHtml = "";
  allocations.map((allocation, index) => {
    allocationListHtml += `
  <div key=${index}>
  <input
    type="radio"
    name="selectedAllocation"
    id="selectedAllocation"
    value=${allocation.id}
  />
  <label htmlFor=${allocation.id}>
    Allocation: ${allocation.id}
  </label>
  <br></br>
</div>`;
  });
  setHtml("listAllocations", allocationListHtml);
  if (allocations && allocations.length > 0) {
    onClickGroup("selectedAllocation", selectAllocation);
  }
};

const listFilesClick = async () => {
  //Call listFiles method
  const selectedAllocation = getSelectedAllocation();
  console.log("listFilesClick selectedAllocation", selectedAllocation);
  const list = (await listObjects(selectedAllocation, "/")) || [];
  console.log("file list", list);
  let fileListHtml = "";
  list.map((file, index) => {
    fileListHtml += `
  <div key=${index}>
  <input
    type="radio"
    name="selectedFile"
    id="selectedFile"
    value=${file.path}
  />
  <label htmlFor=${file.path}>
    ${file.path}
  </label>
  <br></br>
</div>`;
  });
  setHtml("listFiles", fileListHtml);
  if (list && list.length > 0) {
    onClickGroup("selectedFile", selectFile);
  }
};

const getSelectedAllocation = () => {
  const selectedAllocationElement = document.querySelector(
    'input[name="selectedAllocation"]:checked'
  );
  const selectedAllocation = selectedAllocationElement?.value;
  console.log("selected allocation", selectedAllocation);
  return selectedAllocation;
};

const selectAllocation = () => {
  getSelectedAllocation();
};

const handleUploadFiles = async (event) => {
  console.log("handleUploadFiles", event.currentTarget.files);
  //setFilesForUpload(event.currentTarget.files);
};

const getSelectedFile = () => {
  const selectedFileElement = document.querySelector(
    'input[name="selectedFile"]:checked'
  );
  const selectedFile = selectedFileElement?.value;
  console.log("selected file", selectedFile);
  return selectedFile;
};

const selectFile = () => {
  getSelectedFile();
};

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

  onClick("btnSendTransaction", async () => {
    console.log("calling sendTransaction");
    const { clientID, privateKey, publicKey } = getWallet();
    const fromWallet = {
      id: clientID,
      public_key: publicKey,
      secretKey: privateKey,
    };
    const sendTo = get("sendTo").value;
    const sendAmount = get("sendAmount").value;
    await sendTransaction(fromWallet, sendTo, parseInt(sendAmount), "");
  });

  onClick("btnGetBalance", async () => {
    const { clientID } = getWallet();
    const wallet = await getBalanceWasm(clientID);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
  });

  onClick("btnListAllocations", listAllocationsClick);

  onClick("btnCreateAllocation", async () => {
    console.log("calling createAllocation");
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    //name string, datashards, parityshards int, size, expiry int64,minReadPrice, maxReadPrice, minWritePrice, maxWritePrice int64, lock int64,preferredBlobberIds []string
    const config = {
      name: "newalloc",
      datashards: 2,
      parityshards: 2,
      size: 2 * 1073741824,
      expiry: Math.floor(expiry.getTime() / 1000),
      minReadPrice: 0,
      maxReadPrice: 184467440737095516,
      minWritePrice: 0,
      maxWritePrice: 184467440737095516,
      lock: 5000000000,
    };

    //Call createAllocation method
    await createAllocation(config);
    listAllocationsClick();
  });

  onClick("btnGetAllocation", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for get details");
      return;
    }
    const allocation = await getAllocation(selectedAllocation);
    console.log("allocation", allocation);
    let allocationDetailHtml = `
    <div>
      Allocation: ${allocation.id}, Name: ${allocation.name}, Size: ${allocation.size}, Start Time: ${allocation.start_time}, Expiration Date: ${allocation.expiration_date}
    </div>
    <br></br>
  </div>`;
    setHtml("allocationDetails", allocationDetailHtml);
  });

  onChange("uploadFile", handleUploadFiles);

  onClick("btnUpload", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for upload");
      return;
    }
    const filesForUpload = get("uploadFile").files;
    console.log("filesForUpload", filesForUpload);
    if (!(filesForUpload && filesForUpload.length > 0)) {
      alert("Please select the files for upload");
      return;
    }
    console.log("uploading to allocation", selectedAllocation, filesForUpload);
    if (filesForUpload && filesForUpload.length > 0) {
      const objects = [];
      const allocationId = selectedAllocation;
      for (const file of filesForUpload) {
        objects.push({
          allocationId: allocationId,
          remotePath: `/${file.name}`,
          file: file,
          thumbnailBytes: null,
          encrypt: false,
          isUpdate: false,
          isRepair: false,
          numBlocks: 100,
          callback: function (totalBytes, completedBytes, error) {
            console.log(
              file.name +
                " " +
                completedBytes +
                "/" +
                totalBytes +
                " err:" +
                error
            );
          },
        });
      }

      const results = await bulkUpload(objects);

      console.log("upload results", JSON.stringify(results));
    }
  });

  onClick("btnDownload", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for upload");
      return;
    }
    const path = getSelectedFile();
    if (path) {
      const allocationId = selectedAllocation;
      console.log("downloading ", path, " from ", allocationId);

      //allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int
      const file = await download(allocationId, path, "", "", false, 10);
      console.log("downloaded file", file);

      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";

      a.href = file.url;
      a.download = file.fileName;
      a.click();
      window.URL.revokeObjectURL(file.url);
      document.body.removeChild(a);
    }
  });

  onClick("btnListFiles", listFilesClick);

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
