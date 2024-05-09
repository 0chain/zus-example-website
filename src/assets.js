import mime from "mime";
import {
  init,
  createWallet,
  multiDownload,
  setWallet,
  decodeAuthTicket,
  listSharedFiles,
} from "@zerochain/zus-sdk";
import {
  NETWORK,
  AUTH_TICKET,
  RESET_CACHE_ON_RELOAD,
  BATCH_SIZE,
} from "./constant";
import { Notyf } from "notyf";

const configJson = {
  chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
  signatureScheme: "bls0chain",
  minConfirmation: 10,
  minSubmit: 20,
  confirmationChainLength: 3,
  blockWorker: `https://${NETWORK}.zus.network/dns`,
  zboxHost: `https://0box.${NETWORK}.zus.network`,
};

// This will keep track of assets already populated from cache, it's a map so checking it would be done in constant time
const assetsPopulatedFromCache = {};

// to keep track of zus-assets store
let defaultGetStoreFunc;

// initialize wasm with default config
async function initializeWasm() {
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

  await init(config);
}

window.onFileDownload = async (
  totalBytes,
  completedBytes,
  objName,
  objURL,
  err
) => {
  if (err) {
    console.error("error:", err);
    return;
  }
  if (objName && objURL) {
    const elements = findByAttrValue("img", "data-imageName", objName);
    // get file mime type
    const type = mime.getType(objName);
    // this url can be used directly in src attribute of img and video tag
    // convert to raw form and back to blob but with proper mime type this time
    const rawFile = await createBlob(objURL);
    const blobWithActualType = new Blob([rawFile], { type });
    const blobUrl = URL.createObjectURL(blobWithActualType);
    // get img elements that will display fetched assets
    // set src to blob url
    elements.forEach((el) => (el.src = blobUrl));
    if (blobWithActualType.size > 0) {
      cacheAsset(objName, blobWithActualType);
    }
  }
};

const fetchApi = async (url, headers = {}) => {
  const data = await fetch(url, { headers });
  return data.json();
};

const getBlobberDetails = async (allocationId) => {
  const allocationUrl = `https://${NETWORK}1.zus.network/sharder01/v1/screst/6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7/allocation?allocation=`;

  const response = await fetchApi(allocationUrl + allocationId);
  if (response.error) throw new Error(response.error);

  const randomIndex = Math.floor(Math.random() * response?.blobbers?.length);

  return response?.blobbers[randomIndex];
};

const getListSharedFiles = async (
  blobberUrl,
  allocationId,
  lookupHash,
  clientId
) => {
  const url = `${blobberUrl}v1/file/list/${allocationId}?path_hash=${lookupHash}&list=true&limit=-1&offset=0`;

  return fetchApi(url, { "X-App-Client-ID": clientId });
};

(async function () {
  if (RESET_CACHE_ON_RELOAD) clearStore();

  // try populating everything from cache before doing any calls
  await tryPopulatingFromCache();

  /* authTicket of the directory containing zus assets */
  const authTicket = AUTH_TICKET;

  // decode auth ticket
  const authData = JSON.parse(atob(authTicket));

  const allocationId = authData?.allocation_id;
  const lookupHash = authData?.file_path_hash;
  const clientId = authData?.owner_id;

  // resolve blobber url
  const blobber = await getBlobberDetails(allocationId);

  // list files in the directory
  const data = await getListSharedFiles(
    blobber.url,
    allocationId,
    lookupHash,
    clientId
  );

  const notyf = new Notyf({ position: { x: "left", y: "bottom" } });
  const longNotyf = new Notyf({ duration: 7000 });

  notyf.success("Initializing WASM...");
  const start = performance.now();
  // initialiaze and configure wasm
  await initializeWasm();
  const { keys, mnemonic } = await createWallet();
  const { walletId, privateKey, publicKey } = keys;
  await setWallet(walletId, privateKey, publicKey, mnemonic);
  const totalTime = performance.now() - start;
  longNotyf.success(`WASM loaded in ${totalTime / 1000} s`);

  // rearrage the file list so we can download in the order assets are displayed on website
  const filesList = reArrangeArray(data?.list);
  let files = [];
  // create a list of files to be downloaded
  filesList.forEach((file) => {
    if (!assetsPopulatedFromCache[file?.name]) {
      const { path, lookup_hash, name } = file;
      files.push({
        remotePath: path,
        localPath: "",
        downloadOp: 1, // 1 -> download file, 2 -> download thumbnail
        numBlocks: 100,
        remoteFileName: name,
        remoteLookupHash: lookup_hash,
      });
    }
  });

  const batchSize = BATCH_SIZE;

  // remove poster image from files
  files.shift();
  let batchNum = 0;
  notyf.success(`Starting download with batch size of ${batchSize} files...`);
  const start1 = performance.now();

  while (files.length > 0) {
    let batch = [];
    if (files.length >= batchSize) {
      batch = files.splice(0, batchSize);
    } else {
      batch = files.splice(0, files.length);
    }

    const start2 = performance.now();
    notyf.success(
      `Batch#${++batchNum}. ${Math.ceil(
        files.length / batchSize
      )} batches remaining...`
    );
    await multiDownload(
      allocationId,
      JSON.stringify(batch),
      authTicket,
      "onFileDownload"
    );
    const end2 = performance.now() - start2;
    longNotyf.success(`Batch ${batchNum} completed in ${end2 / 1000} s`);
  }
  const end1 = performance.now() - start1;
  longNotyf.success(`Download complete in ${end1 / 1000} s`);
  logTotalSizeDownloadedWithTimeout();
})();

// using map to fetch priority in constant time
const assetPriority = {
  "poster.png": 0,
  "discord.svg": 1,
  "twitter.svg": 2,
  "telegram.svg": 3,
  "storeIcon.png": 4,
  "buildIcon.png": 5,
  "earnIcon.png": 6,
  "blimpLogo.svg": 7,
  "blimpArt.png": 8,
  "showcaseArt.png": 9,
  "poster2.jpg": 10,
  "vultLogo.svg": 11,
  "vultArt.png": 12,
  "chimneyLogo.svg": 13,
  "chimneyArt.png": 14,
  "chalkLogo.svg": 15,
  "chalkArtMobile.png": 16,
  "chalkArtDesktop.png": 17,
  "infographic.png": 18,
  "huawei.svg": 19,
  "chainlink.svg": 20,
  "polygon.svg": 21,
  "fetchai.svg": 22,
  "ocean.svg": 23,
  "magma.svg": 24,
  "wanchain.svg": 25,
  "geeq.svg": 26,
  "kylin.svg": 27,
  "morpheus-labs.svg": 28,
  "clover.svg": 29,
  "dia.svg": 30,
  "fuse.svg": 31,
  "api3.svg": 32,
  "teraswitch.svg": 33,
  "coresite.svg": 34,
  "cogent.svg": 35,
  "zero.svg": 36,
  "unihost.svg": 37,
  "velia.svg": 38,
  "plus.svg": 39,
  "zusLogoWhite.svg": 40,
  "discord_social.svg": 41,
  "twitter_social.svg": 42,
  "medium_social.svg": 43,
  "telegram_social.svg": 44,
  "atlus.svg": 45,
  "blimp.svg": 46,
  "bolt.svg": 47,
  "chalk.svg": 48,
  "chimney.svg": 49,
  "vult.svg": 50,
  "facebook.svg": 51,
  "linkedin.svg": 52,
  "youtube.svg": 53,
  "github.svg": 54,
  "medium.svg": 55,
};

// rearrange array so we can download images in order they're displayed on the webpage
function reArrangeArray(filesArr) {
  let newArray = [];
  for (let i = 0; i < filesArr.length; i++) {
    let currentValue = assetPriority[filesArr[i].name];
    if (isNaN(currentValue) || !filesArr[i]) continue;
    newArray[currentValue] = filesArr[i];
  }
  newArray = newArray.filter((item) => item);
  return newArray;
}

// This will try populating from cache before doing wasm init or any API calls,
async function tryPopulatingFromCache() {
  const elements = document.querySelectorAll("img[data-imagename]");
  for (let el of elements) {
    const assetName = el.getAttribute("data-imagename");
    if (assetName) {
      const cachedData = await getValue(assetName);
      if (cachedData) {
        const url = URL.createObjectURL(cachedData);
        el.src = url;
        assetsPopulatedFromCache[assetName] = true;
      }
    }
  }
}
// find element from dom by type, attribute name and attribute value
function findByAttrValue(type, attr, value) {
  const elements = document.getElementsByTagName(type);
  const matchingElements = [];
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute(attr) === value) {
      matchingElements.push(elements[i]);
    }
  }
  return matchingElements;
}

// cache asset into indexed db
async function cacheAsset(key, data) {
  await setValue(key, data);
}

// get blob data from url
async function createBlob(url) {
  const response = await fetch(url);
  const data = await response.blob();
  return data;
}

// create/return indexed db
function createStore(dbName, storeName) {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);

  return (txMode, callback) =>
    dbp.then((db) =>
      callback(db.transaction(storeName, txMode).objectStore(storeName))
    );
}

// save value to indexed db
function setValue(key, value, customStore = getDefaultStore()) {
  return customStore("readwrite", (store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}

async function clearStore(
  dbName = "zus-assets-store",
  storeName = "zus-assets"
) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onerror = (event) => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);
      const clearRequest = objectStore.clear();
      clearRequest.onerror = (event) => {
        reject(new Error("Failed to clear store"));
      };
      clearRequest.onsuccess = (event) => {
        resolve();
      };
    };
  });
}
window.clearStore = clearStore;

// get zus db from indexed db if already exits, else create new db and store
function getDefaultStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore("zus-assets-store", "zus-assets");
  }
  return defaultGetStoreFunc;
}

// retrieve value from indexed db
function getValue(key, customStore = getDefaultStore()) {
  return customStore("readonly", (store) => promisifyRequest(store.get(key)));
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}

function getTotalBlobSizeInMB() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open("zus-assets-store");

    dbRequest.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction(["zus-assets"], "readonly");
      const objectStore = transaction.objectStore("zus-assets");
      let totalSize = 0;

      objectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          totalSize += cursor.value.size; // Assuming 'size' is the property storing the blob size
          cursor.continue();
        } else {
          const totalSizeInMB = totalSize / (1024 * 1024);
          resolve(totalSizeInMB);
        }
      };

      transaction.oncomplete = function () {
        db.close();
      };

      transaction.onerror = function (event) {
        reject(event.target.error);
      };
    };

    dbRequest.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

const logTotalSizeDownloadedWithTimeout = (timeout = 3000) => {
  const notyf = new Notyf({
    duration: 3000,
    position: { x: "right", y: "top" },
  });
  setTimeout(() => {
    getTotalBlobSizeInMB()
      .then((totalSizeInMB) => {
        notyf.success(
          `Total size of stored blobs: ${totalSizeInMB.toFixed(2)} MB`
        );
      })
      .catch((error) => {
        notyf.error(`Error retrieving total blob size: ${error}`);
      });
  }, timeout);
};
