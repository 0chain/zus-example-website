import mime from "mime";
import {
    init,
    createWallet,
    download,
    setWallet,
    decodeAuthTicket,
    listSharedFiles,
} from "@zerochain/zus-sdk";

const configJson = {
    chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
    signatureScheme: "bls0chain",
    minConfirmation: 50,
    minSubmit: 50,
    confirmationChainLength: 3,
    blockWorker: "https://demo.zus.network/dns",
    zboxHost: "https://0box.demo.zus.network"
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
    ];

    await init(config);
}


(async function () {
    // try populating everything from cache before doing any calls
    await tryPopulatingFromCache();
    // initialiaze and configure wasm
    await initializeWasm();
    const { keys, mnemonic } = await createWallet();
    const { walletId, privateKey, publicKey } = keys;
    await setWallet(walletId, privateKey, publicKey, mnemonic);
    // authTicket of the directory containing zus assets
    const authTicket = "eyJjbGllbnRfaWQiOiIiLCJvd25lcl9pZCI6ImE2Nzg1YjdjMzIxN2U5ODcyZTUwMmU2YTcwYmQwMTZiMDA3MGEyMDg3YzAzMTUyNmIxODMxZjU4OTVlMzZiMWEiLCJhbGxvY2F0aW9uX2lkIjoiY2M0OWUwOWE2ZWZjMzY4ZDJlNzdiYjEzMjQwNDI0YzQ5NzAwZDg1NTMzYmE3NGFkNzliMDU0NzA0NzdiYjQ4MiIsImZpbGVfcGF0aF9oYXNoIjoiMDMyMTU3NGIyMjM4YWU2YWFkNzY5MTNmNGZjNjUwMzE3NzgxNDAxYzY2YWNmMDMxNGEyNzIwNTU3MTkxNWYxZCIsImFjdHVhbF9maWxlX2hhc2giOiIiLCJmaWxlX25hbWUiOiJOZXcgRm9sZGVyIiwicmVmZXJlbmNlX3R5cGUiOiJkIiwiZXhwaXJhdGlvbiI6MCwidGltZXN0YW1wIjoxNjg2Mzg1NzA2LCJlbmNyeXB0ZWQiOmZhbHNlLCJzaWduYXR1cmUiOiI4ZWM3YzgxNTdhZDdjZWUxMzYzYWZlZjMyMWE5ZjEzMDE0M2JmN2FkODVhN2Q2NDEzMGMwZWFmYmVlOGFmMThmIn0=";
    const authData = await decodeAuthTicket(authTicket);
    // list files in the directory
    const { data } = await listSharedFiles(authData?.file_path_hash, authData?.allocation_id, authData?.owner_id);
    // rearrage the file list so we can download in the order assets are displayed on website
    const filesList = reArrageArray(data?.list);
    // loop over the list and download each file, this is currently done sequentially, will do it in parallel once parallel download is working on wasm
    for (let file = 0; file < filesList.length; file++) {
        const fileDetails = filesList[file];
        if(assetsPopulatedFromCache[fileDetails?.name]) continue;
        const elements = findByAttrValue("img", "data-imageName", fileDetails?.name);
        const downloadedFile = await download(
            fileDetails?.allocation_id,
            '',
            authTicket,
            fileDetails?.lookup_hash,
            false,
            100,
            '',
        );
        // get file mime type
        const type = mime.getType(downloadedFile?.fileName);
        // this url can be used directly in src attribute of img and video tag
        // convert to raw form and back to blob but with proper mime type this time
        const rawFile = await createBlob(downloadedFile?.url);
        const blobWithActualType = new Blob([rawFile], { type });
        const blobUrl = URL.createObjectURL(blobWithActualType);
        // get img elements that will display fetched assets
        // set src to blob url
        elements.forEach(el => el.src = blobUrl)
        if(blobWithActualType.size > 0){
            cacheAsset(downloadedFile?.fileName, blobWithActualType);
        };
    }
})();

// This will try populating from cache before doing wasm init or any API calls,
async function tryPopulatingFromCache() {
    const elements = document.querySelectorAll("img[data-imagename]");
    for (let el of elements) {
        const assetName = el.getAttribute("data-imagename")
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
        };
    };
    return matchingElements;
}

// using map to fetch priority in constant time
const assetPriority = {
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
    'infographic.png': 18,
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
function reArrageArray(filesArr) {
    let newArray = [];
    for (let i = 0; i < filesArr.length; i++) {
        let currentValue = assetPriority[filesArr[i].name];
        if (!currentValue || !filesArr[i]) continue;
        newArray[currentValue - 1] = filesArr[i];
    };
    newArray = newArray.filter(item => item);
    return newArray;
};

// cache asset into indexed db
async function cacheAsset(key, data) {
    await setValue(key, data);
};

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
            callback(db.transaction(storeName, txMode).objectStore(storeName)),
        );
}


// save value to indexed db
function setValue(key, value, customStore = getDefaultStore()) {
    return customStore('readwrite', (store) => {
        store.put(value, key);
        return promisifyRequest(store.transaction);
    });
}

// get zus db from indexed db if already exits, else create new db and store
function getDefaultStore() {
    if (!defaultGetStoreFunc) {
        defaultGetStoreFunc = createStore('zus-assets-store', 'zus-assets');
    }
    return defaultGetStoreFunc;
}

// retrieve value from indexed db
function getValue(key, customStore = getDefaultStore()) {
    return customStore('readonly', (store) => promisifyRequest(store.get(key)));
}

function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.oncomplete = request.onsuccess = () => resolve(request.result);
        request.onabort = request.onerror = () => reject(request.error);
    });
}