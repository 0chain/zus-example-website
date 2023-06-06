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
    const filesList = data?.list

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
        // set poster for video file
        if (downloadedFile?.fileName === "poster.png") {
            const videoElement = document.getElementById("video")
            videoElement.setAttribute("poster", downloadedFile?.url)
            continue
        }
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
        // revoke object url to avoid memory lead
        setTimeout(() => URL.revokeObjectURL(blobUrl))
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