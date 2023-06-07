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
    zboxHost: "https://0box.demo.zus.network",
    zboxAppType: "blimp",
};

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
    // initialiaze and configure wasm
    await initializeWasm()
    const { keys, mnemonic } = await createWallet();
    const { walletId, privateKey, publicKey } = keys
    await setWallet(walletId, privateKey, publicKey, mnemonic);
    // authTicket of the directory containing zus assets
    const authTicket = "eyJjbGllbnRfaWQiOiIiLCJvd25lcl9pZCI6ImZhNmI4ZDdkN2RiZjY1OWEzZjQ2NzIxOWU4ZTFjY2E4YmM3YzE3ZmY0Y2M4MzkxNjQzMTMwNDhiNjVmMzViZGYiLCJhbGxvY2F0aW9uX2lkIjoiZDVjZTg5MzIzNjNkOWM4NGY4NTU3MzhmNDllNTIzM2RkOTY1MGQ2MmU3MjA2ZTNhYWNiNDMwNDQ5OTlmNWYwNiIsImZpbGVfcGF0aF9oYXNoIjoiNjVkNjQ2YjcxZjNlZGQ0NzllYjZmNjY3MzU2NzlkZjc3OGRhMTYxYzRkYWY5MjYwZjFkNWU2YTJjNmM1ZjUyNSIsImFjdHVhbF9maWxlX2hhc2giOiIiLCJmaWxlX25hbWUiOiJOZXcgRm9sZGVyIiwicmVmZXJlbmNlX3R5cGUiOiJkIiwiZXhwaXJhdGlvbiI6MCwidGltZXN0YW1wIjoxNjg1OTg3Mjc5LCJlbmNyeXB0ZWQiOmZhbHNlLCJzaWduYXR1cmUiOiJkYmMxZTBkNWJkNDVlYzU0MjkxMTIxOTRhZTIzNWViNDk1MDdmMjM1OWY5YjJhZDM2OWUwNDk3NDNiOWNhODAwIn0="
    const authData = await decodeAuthTicket(authTicket)
    // list files in the directory
    const { data } = await listSharedFiles(authData?.file_path_hash, authData?.allocation_id, authData?.owner_id)
    // rearrage the file list so we can download in the order assets are displayed on website
    const  filesList = reArrageArray(data?.list)
    // loop over the list and download each file, this is currently done sequentially, will do it in parallel once parallel download is working on wasm
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
        // get file mime type
        const type = mime.getType(downloadedFile?.fileName)
        // this url can be used directly in src attribute of img and video tag
        let blobUrl = downloadedFile?.url
        // if file type is svg, the blob url doesn't work directly in img src attribute since the mime type is octet-stream
        if (type.includes("svg")) {
            // convert to raw form and back to blob but with proper mime type this time
            const rawFile = await (await fetch(downloadedFile?.url)).blob()
            const blobWithActualType = new Blob([rawFile], { type })
            blobUrl = URL.createObjectURL(blobWithActualType)
        }
        // get img and video element to display fetched assets
        let elements = []
        if (type.includes("video")) {
            elements = findByAttrValue("video", "data-imageName", downloadedFile?.fileName.substr(0, downloadedFile?.fileName.lastIndexOf(".")))
        }
        else {
            elements = findByAttrValue("img", "data-imageName", downloadedFile?.fileName.substr(0, downloadedFile?.fileName.lastIndexOf(".")))
        }
        // set src to blob url
        elements.forEach(el => el.src = blobUrl)
    }
})();

// find element from dom by type, attribute name and attribute value
function findByAttrValue(type, attr, value) {
    const elements = document.getElementsByTagName(type);
    const matchingElements = []
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].getAttribute(attr) === value) {
            matchingElements.push(elements[i])
        }
    }
    return matchingElements
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
}

// rearrange array so we can download images in order they're displayed on the webpage
function reArrageArray(filesArr) {
    let newArray = []
    for (let i = 0; i < filesArr.length; i++) {
        let currentValue = assetPriority[filesArr[i].name]
        if(!currentValue || !filesArr[i]) continue
        newArray[currentValue - 1] = filesArr[i]
    }
    return newArray
}


// To use when parallel download issue is fixed on wasm
// const promises = filesList.map(file => new Promise(async (resolve, reject) => {
//     const downloadedFile = await download(
//         file?.allocation_id,
//         '',
//         authTicket,
//         file?.lookup_hash,
//         false,
//         100,
//         '',
//     );
//     const type = mime.getType(downloadedFile?.fileName)
//     let blobUrl = downloadedFile?.url
//     if (type.includes("svg")) {
//         const rawFile = await (await fetch(downloadedFile?.url)).blob()
//         const blobWithActualType = new Blob([rawFile], { type })
//         blobUrl = URL.createObjectURL(blobWithActualType)
//     }
//     let elements = findByAttrValue("img", downloadedFile?.fileName.substr(0, downloadedFile?.fileName.lastIndexOf(".")))
//     if (type.includes("video")) {
//         elements = findByAttrValue("video", downloadedFile?.fileName.substr(0, downloadedFile?.fileName.lastIndexOf(".")))
//     }
//     elements.forEach(el => el.src = blobUrl)
//     resolve()
// }))
// await Promise.all([...promises])