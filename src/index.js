import {
  init,
  setWallet,
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
  share,
  showLogs,
  hideLogs,
  copyObject,
  moveObject,
  deleteObject,
  renameObject,
  reloadAllocation,
  freezeAllocation,
  cancelAllocation,
  updateAllocation,
  createDir,
  getFileStats,
  downloadBlocks,
  getUSDRate,
  isWalletID,
  getPublicEncryptionKey,
  getLookupHash,
  createAllocationWithBlobbers,
  getAllocationBlobbers,
  getBlobberIds,
  createReadPool,
  createWallet,
  recoverWallet,
  getAllocationFromAuthTicket,
  getReadPoolInfo,
  lockWritePool,
  getBlobbers,
  decodeAuthTicket,
  initBridge,
  burnZCN,
  mintZCN,
  getMintWZCNPayload,
} from "@zerochain/zus-sdk";

import { get, onClick, onClickGroup, setHtml, onChange, setValue } from "./dom";
import { startPlay, stopPlay } from "./player";

const shouldShowLogs = process.env.NODE_ENV === "development";
const log = (...args) => shouldShowLogs && console.log(...args);

const getWallet = () => {
  const clientID = get("clientId").value;
  const publicKey = get("publicKey").value;
  const privateKey = get("privateKey").value;
  const mnemonic = get("mnemonic").value;

  return {
    clientID,
    privateKey,
    publicKey,
    mnemonic,
  };
};

const configJson = {
  chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
  signatureScheme: "bls0chain",
  minConfirmation: 10,
  minSubmit: 20,
  confirmationChainLength: 3,
  blockWorker: "https://dev.zus.network/dns",
  zboxHost: "https://0box.dev.zus.network",
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
  3,
];

window.downloadCallback = function (totalBytes, completedBytes, error) {
  log("download: " + completedBytes + "/" + totalBytes + " err:" + error);
};

const getAppendedFileName = (filename, postfix) => {
  const isExtnExist = filename.lastIndexOf(".") > 0;
  const newFileName = isExtnExist
    ? filename.substring(0, filename.lastIndexOf(".")) +
      postfix +
      filename.substring(filename.lastIndexOf("."), filename.length)
    : filename + postfix;
  log("getAppendedFileName", newFileName);
  return newFileName;
};

const listAllocationsClick = async () => {
  //Call listAllocations method
  const allocations = await listAllocations();
  log("allocations", allocations);
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
  log("listFilesClick selectedAllocation", selectedAllocation);
  let fileListHtml = "";
  try {
    const list = (await listObjects(selectedAllocation, "/")) || [];
    files = list;
    log("file list", list);
    if (list && list.length > 0) {
      fileListHtml += `
    <div>
      <b>File List: /</b>
    </div>
    `;
    }

    list.map((file) => {
      fileListHtml += `
  <div>
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
  } catch (error) {
    log("error:", error);
  }

  try {
    const destList = (await listObjects(selectedAllocation, "/test")) || [];
    log("file destList", destList);
    if (destList && destList.length > 0) {
      fileListHtml += `
    <div>
      <b>File List: /test</b>
    </div>
    `;
    }

    destList.map((file) => {
      fileListHtml += `
  <div>
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
  } catch (error) {
    log("error:", error);
  }

  setHtml("listFiles", fileListHtml);
  if (fileListHtml && fileListHtml.length > 0) {
    onClickGroup("selectedFile", selectFile);
  }
};

const getSelectedAllocation = () => {
  const selectedAllocationElement = document.querySelector(
    'input[name="selectedAllocation"]:checked'
  );
  const selectedAllocation = selectedAllocationElement?.value;
  log("selected allocation", selectedAllocation);
  return selectedAllocation;
};

const selectAllocation = () => {
  getSelectedAllocation();
};

const handleUploadFiles = async (event) => {
  log("handleUploadFiles", event.currentTarget.files);
  //setFilesForUpload(event.currentTarget.files);
};

const getSelectedFile = () => {
  const selectedFileElement = document.querySelector(
    'input[name="selectedFile"]:checked'
  );
  const selectedFile = selectedFileElement?.value;
  log("selected file", selectedFile);
  return selectedFile;
};

const selectFile = () => {
  getSelectedFile();
};

const handleUpdateMnemonic = async (event) => {
  log("handleUpdateMnemonic", event.currentTarget.value);
  setValue("mnemonic", event.currentTarget.value);
};

const getBlobberListForAllocation = async () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  const referredBlobberURLs = [
      "https://dev2.zus.network/blobber02",
      "https://dev1.zus.network/blobber02",
    ],
    dataShards = 2,
    parityShards = 2,
    size = 2 * 1073741824,
    expiry = Math.floor(expiryDate.getTime() / 1000),
    minReadPrice = 0,
    maxReadPrice = 184467440737095516,
    minWritePrice = 0,
    maxWritePrice = 184467440737095516;

  //Call getAllocationBlobbers method
  const blobberList = await getAllocationBlobbers(
    referredBlobberURLs,
    dataShards,
    parityShards,
    size,
    expiry,
    minReadPrice,
    maxReadPrice,
    minWritePrice,
    maxWritePrice
  );
  log("blobberList", blobberList);
  return blobberList;
};

let files = [];

const bindEvents = () => {
  log("bindEvents");

  onClick("btnGreet", async () => {
    log("calling Greet");
    log("greetMessage", greetMessage);
    setHtml("message", greetMessage);
  });

  onClick("btnInit", async () => {
    log("calling init");
    //Initialize SDK
    await init(config);
  });

  onClick("btnSetWallet", async () => {
    const { clientID, privateKey, publicKey, mnemonic } = getWallet();
    await setWallet(clientID, privateKey, publicKey, mnemonic);
  });

  onClick("btnSendMeTokens", async () => {
    await getFaucetToken();
  });

  onClick("btnSendTransaction", async () => {
    log("calling sendTransaction");
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
    const wallet = await getBalance(clientID);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
  });

  onClick("btnGetBalanceWasm", async () => {
    const { clientID } = getWallet();
    const wallet = await getBalanceWasm(clientID);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
  });

  onClick("btnCreateWallet", async () => {
    log("calling createWallet");
    const wallet = await createWallet();
    log("Wallet", wallet);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
    setValue("clientId", wallet.keys.walletId);
    setValue("publicKey", wallet.keys.publicKey);
    setValue("privateKey", wallet.keys.privateKey);
  });

  onClick("btnRecoverWallet", async () => {
    log("calling recoverWallet");
    const mnemonic = get("mnemonic").value;
    const wallet = await recoverWallet(mnemonic);
    log("Wallet", wallet);
    txtOutput.innerHTML = JSON.stringify(wallet, null, 2);
    setValue("clientId", wallet.keys.walletId);
    setValue("publicKey", wallet.keys.publicKey);
    setValue("privateKey", wallet.keys.privateKey);
  });

  onClick("btnListAllocations", listAllocationsClick);

  onClick("btnCreateAllocation", async () => {
    log("calling createAllocation");
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    //datashards, parityshards int, size, expiry int64,minReadPrice, maxReadPrice, minWritePrice, maxWritePrice int64, lock int64,preferredBlobberIds []string
    const config = {
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
    log("allocation", allocation);
    let allocationDetailHtml = `
    <div>
      Allocation: ${allocation.id}, Size: ${allocation.size}, Start Time: ${allocation.start_time}, Expiration Date: ${allocation.expiration_date}
    </div>
    <br></br>
  </div>`;
    setHtml("allocationDetails", allocationDetailHtml);
  });

  onClick("btnReloadAllocation", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for reload");
      return;
    }
    const allocation = await reloadAllocation(selectedAllocation);
    log("allocation", allocation);
    let allocationDetailHtml = `
    <div>
      Allocation: ${allocation.id}, Name: ${allocation.name}, Size: ${allocation.size}, Start Time: ${allocation.start_time}, Expiration Date: ${allocation.expiration_date}
    </div>
    <br></br>
  </div>`;
    setHtml("allocationDetails", allocationDetailHtml);
  });

  onClick("btnFreezeAllocation", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for freeze");
      return;
    }
    await freezeAllocation(selectedAllocation);
  });

  onClick("btnCancelAllocation", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for cancel");
      return;
    }
    await cancelAllocation(selectedAllocation);
  });

  onClick("btnUpdateAllocation", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for update");
      return;
    }
    log("updating allocation", selectedAllocation);

    const allocationSize = get("allocationSize").value;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    //allocationId string,size, expiry int64,lock int64, isImmutable, updateTerms bool,addBlobberId, removeBlobberId string
    const size = parseInt(allocationSize),
      expiryVal = Math.floor(expiry.getTime() / 1000),
      lock = 5000000000,
      updateTerms = true,
      addBlobberId = "",
      removeBlobberId = "";

    //Call updateAllocation method
    await updateAllocation(
      selectedAllocation,
      size,
      expiryVal,
      lock,
      updateTerms,
      addBlobberId,
      removeBlobberId
    );
  });

  onChange("uploadFile", handleUploadFiles);

  onClick("btnUpload", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for upload");
      return;
    }
    const filesForUpload = get("uploadFile").files;
    log("filesForUpload", filesForUpload);
    if (!(filesForUpload && filesForUpload.length > 0)) {
      alert("Please select the files for upload");
      return;
    }
    log("uploading to allocation", selectedAllocation, filesForUpload);
    if (filesForUpload && filesForUpload.length > 0) {
      const objects = [];
      const allocationId = selectedAllocation;
      for (const file of filesForUpload) {
        objects.push({
          allocationId: allocationId,
          remotePath: `/${file.name}`,
          file: file,
          // thumbnailBytes: await readBytes(file), //only for demo, don't upload original file as thumbnail in production
          thumbnailBytes: "",
          encrypt: false,
          isUpdate: false,
          isRepair: false,
          numBlocks: 100,
          callback: function (totalBytes, completedBytes, error) {
            log(
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

      log("upload results", JSON.stringify(results));
    }
  });

  onClick("btnDownload", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for download");
      return;
    }
    const path = getSelectedFile();
    if (path) {
      const allocationId = selectedAllocation;
      log("downloading ", path, " from ", allocationId);

      //allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int, callback
      const file = await download(
        allocationId,
        path,
        "",
        "",
        false,
        10,
        "downloadCallback"
      );
      log("downloaded file", file);

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

  onClick("btnShare", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation for share");
      return;
    }
    const path = getSelectedFile();
    if (path) {
      const allocationId = selectedAllocation;
      log("sharing ", path, " from ", allocationId);

      //allocationId, filePath, clientId, encryptionPublicKey string, expireAt int, revoke bool,availableAfter string
      const authTicket = await share(allocationId, path, "", "", 0, false, 0);
      log("authTicket", authTicket);
      setValue("authTicket", authTicket);
    }
  });

  onClick("btnDownloadShared", async () => {
    const authTicket = get("authTicket").value;
    if (authTicket) {
      log("downloading using authTicket", authTicket);

      //allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int
      const file = await download("", "", authTicket, "", false, 10);
      log("downloaded file", file);

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

  onClick("btnCopy", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for copy");
      return;
    }
    log("copy file", selectedAllocation, path);
    //allocationId, path, destination
    await copyObject(selectedAllocation, path, "/test");
    log("copy completed");
  });

  onClick("btnMove", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for move");
      return;
    }
    log("move file", selectedAllocation, path);
    //allocationId, path, destination
    await moveObject(selectedAllocation, path, "/test");
    log("move completed");
  });

  onClick("btnDelete", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for delete");
      return;
    }
    log("delete file", selectedAllocation, path);
    //allocationId, path
    await deleteObject(selectedAllocation, path);
    log("delete completed");
  });

  onClick("btnRename", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for rename");
      return;
    }
    log("rename file", selectedAllocation, path);
    //allocationId, path, newName
    await renameObject(
      selectedAllocation,
      path,
      getAppendedFileName(path, "_new")
    );
    log("rename completed");
  });

  const player = get("player");
  let isPlayerReady = false;

  onClick("btnPlay", async () => {
    if (isPlayerReady) {
      if (player.paused) {
        player.play();
      }
    } else {
      const file = files.find((it) => it.path == getSelectedFile());
      log("playing file", file);
      const isLive = file.type == "d";

      if (file) {
        const allocationId = getSelectedAllocation();
        startPlay({
          allocationId,
          videoElement: player,
          remotePath: file?.path,
          authTicket: "",
          lookupHash: file?.lookup_hash,
          mimeType: file?.mimetype,
          isLive: isLive,
        });
        isPlayerReady = true;
      }
    }
  });

  onClick("btnPlayShared", async () => {
    if (isPlayerReady) {
      if (player.paused) {
        player.play();
      }
    } else {
      const authTicket = get("authTicket").value;

      const isLive = false;

      if (authTicket) {
        const allocationId = getSelectedAllocation();
        startPlay({
          allocationId,
          videoElement: player,
          remotePath: "",
          authTicket: authTicket,
          lookupHash: "",
          mimeType: "",
          isLive: isLive,
        });
        isPlayerReady = true;
      }
    }
  });

  onClick("btnPause", async () => {
    player.pause();
  });

  onClick("btnStop", async () => {
    if (isPlayerReady) {
      stopPlay({ videoElement: player });
      isPlayerReady = false;
    }
  });

  onClick("btnCreateDir", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const dirName = get("dirName").value;
    log("Create Dir", selectedAllocation, dirName);
    //allocationId, path
    await createDir(selectedAllocation, "/" + dirName);
    log("create Dir completed");
  });

  onClick("btnGetFileStats", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for stats");
      return;
    }
    log("getting file stats", selectedAllocation, path);
    const fileStats = await getFileStats(selectedAllocation, path);
    log("file stats completed", fileStats);
  });

  onClick("btnDownloadBlocks", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for download blocks");
      return;
    }
    log("download blocks", selectedAllocation, path);
    //allocationID, remotePath, authTicket, lookupHash string, numBlocks int, startBlockNumber, endBlockNumber int64, callbackFuncName string
    const output = await downloadBlocks(
      selectedAllocation,
      path,
      "",
      "",
      10,
      0,
      10
    );
    log("downloaded blocks", output);
  });

  onClick("btnGetLookupHash", async () => {
    const selectedAllocation = getSelectedAllocation();
    if (!selectedAllocation) {
      alert("Please select allocation");
      return;
    }
    const path = getSelectedFile();
    if (!path) {
      alert("Please select the file for getLookupHash");
      return;
    }
    log("getLookupHash file", selectedAllocation, path);
    //allocationId, path
    const hash = await getLookupHash(selectedAllocation, path);
    log("getLookupHash completed", hash);
  });

  onClick("btnGetPublicEncryptKey", async () => {
    const mnemonic = get("mnemonic").value;
    log("getPublicEncryptionKey", mnemonic);
    const key = await getPublicEncryptionKey(mnemonic);
    log("getPublicEncryptionKey completed", key);
    setHtml("encryptKey", key);
  });

  onChange("mnemonic", handleUpdateMnemonic);

  onClick("btnGetPublicEncryptKey", async () => {
    const mnemonic = get("mnemonic").value;
    log("getPublicEncryptionKey", mnemonic);
    const key = await getPublicEncryptionKey(mnemonic);
    log("getPublicEncryptionKey completed", key);
    setHtml("encryptKey", key);
  });

  onClick("btnGetUSDRate", async () => {
    log("getUSDRate");
    const rate = await getUSDRate("zcn");
    log("getUSDRate completed", rate);
    setHtml("utilsOutput", rate);
  });

  onClick("btnIsWalletID", async () => {
    const clientId = get("clientId").value;
    log("isWalletID", clientId);
    const output = await isWalletID(clientId);
    // const output = await isWalletID("test");
    log("isWalletID completed", output);
    setHtml("utilsOutput", output);
  });

  onClick("btnCreateAllocationWithBlobbers", async () => {
    log("CreateAllocationWithBlobbers");
    const preferredBlobbers = getBlobberListForAllocation();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    //datashards, parityshards int, size, expiry int64,minReadPrice, maxReadPrice, minWritePrice, maxWritePrice int64, lock int64,preferredBlobberIds []string
    const config = {
      datashards: 2,
      parityshards: 2,
      size: 2 * 1073741824,
      expiry: Math.floor(expiry.getTime() / 1000),
      minReadPrice: 0,
      maxReadPrice: 184467440737095516,
      minWritePrice: 0,
      maxWritePrice: 184467440737095516,
      lock: 5000000000,
      blobbers: preferredBlobbers,
    };

    //Call createAllocationWithBlobbers method
    await createAllocationWithBlobbers(config);
    listAllocationsClick();
  });

  onClick("btnGetAllocationBlobbers", async () => {
    log("GetAllocationBlobbers");
    await getBlobberListForAllocation();
  });

  onClick("btnGetBlobberIds", async () => {
    log("GetBlobberIds");
    //https://dev1.zus.network/sharder01/v1/screst/6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7/getblobbers
    //const blobberUrls = [];
    const blobberUrls = [
      "https://dev2.zus.network/blobber02",
      "https://dev1.zus.network/blobber02",
    ];
    //Call getBlobberIds method
    const blobberIds = await getBlobberIds(blobberUrls);
    log("blobberIds", blobberIds);
  });

  onClick("btnCreateReadPool", async () => {
    log("CreateReadPool");
    //Call createReadPool method
    const result = await createReadPool();
    log("result", result);
  });

  onClick("btnGetAllocFromAuthTicket", async () => {
    const authTicket = get("authTicket").value;
    log("GetAllocFromAuthTicket", authTicket);
    const allocation = await getAllocationFromAuthTicket(authTicket);
    log("allocation", allocation);
  });

  onClick("btnGetReadPoolInfo", async () => {
    const clientId = get("clientId").value;
    log("GetReadPoolInfo", clientId);
    const result = await getReadPoolInfo(clientId);
    log("result", result);
  });

  onClick("btnLockWritePool", async () => {
    const allocationId = getSelectedAllocation();
    log("LockWritePool", allocationId);
    //allocationId string, tokens string, fee string
    const result = await lockWritePool(allocationId, 1000, 10);
    log("result", result);
  });

  onClick("btnGetBlobbers", async () => {
    log("GetBlobbers");
    const result = await getBlobbers();
    log("result", result);
  });

  onClick("btnDecodeAuthTicket", async () => {
    const authTicket = get("authTicket").value;
    log("DecodeAuthTicket", authTicket);
    const result = await decodeAuthTicket(authTicket);
    log("result", result);
  });

  onClick("btnInitBridge", async () => {
    const ethereumAddress = "0x5B9eb7E72247c45F6c4B8424FB2002151c57c54d",
      bridgeAddress = "0x2405e40161ea6da91AE0e95061e7A8462b4D5eEa",
      authorizersAddress = "0xB132C20A02AD7C38d88805F0e3fFDdfb54224C58",
      wzcnAddress = "0x10140fbca3a468A1c35F132D75659eF0EB5d95DB",
      ethereumNodeURL =
        "https://goerli.infura.io/v3/6141be73a15d47748af0dc14f53d57d7",
      gasLimit = 300000,
      value = 0,
      consensusThreshold = 75.0;
    log(
      "initBridgeClick",
      ethereumAddress,
      bridgeAddress,
      authorizersAddress,
      wzcnAddress,
      ethereumNodeURL,
      gasLimit,
      value,
      consensusThreshold
    );
    //Call initBridge method
    await initBridge(
      ethereumAddress,
      bridgeAddress,
      authorizersAddress,
      wzcnAddress,
      ethereumNodeURL,
      gasLimit,
      value,
      consensusThreshold
    );
  });

  onClick("btnBurnZCN", async () => {
    const amount = 1000;
    log("burnZCNClick", amount);
    const hash = await burnZCN(amount);
    setValue("txHash", hash);
    return hash;
  });

  onClick("btnGetMintWZCNPayload", async () => {
    const burnTrxHash = get("txHash").value;
    log("getMintWZCNPayloadClick", burnTrxHash);
    const result = await getMintWZCNPayload(burnTrxHash);
    return result;
  });

  onClick("btnMintZCN", async () => {
    const burnTrxHash = get("txHash").value;
    const timeout = 100;
    log("mintZCNClick", burnTrxHash, timeout);
    const hash = await mintZCN(burnTrxHash, timeout);
    return hash;
  });

  const log = console.log;
  const logs = get("logs");
  onClick("btnShowLogs", async () => {
    await showLogs();
    console.log = (s) => {
      log(s);
      logs.value += s;
      logs.scrollLeft = 0;
      logs.scrollTop = logs.scrollHeight;
    };
  });

  onClick("btnHideLogs", async () => {
    await hideLogs();
    console.log = log;
  });
};

window.onload = bindEvents;
