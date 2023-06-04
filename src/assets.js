import {
    init,
    download,
    createWallet,
    setWallet,
} from "@zerochain/zus-sdk";

const configJson = {
    chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
    signatureScheme: "bls0chain",
    minConfirmation: 50,
    minSubmit: 50,
    confirmationChainLength: 3,
    blockWorker: "https://dev.zus.network/dns",
    zboxHost: "https://0box.dev.zus.network",
    zboxAppType: "blimp",
  };


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
        await initializeWasm()
        const { keys, mnemonic } = await createWallet();
        const {walletId, privateKey, publicKey} = keys
        await setWallet(walletId, privateKey, publicKey, mnemonic);

        //allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int, callback
        const file = await download(
            "f44e906cd5e903c29497337021c78bd9877a575ed49c224ac818352c0fdac76c",
            "",
            "eyJjbGllbnRfaWQiOiIiLCJvd25lcl9pZCI6IjI5OWJiN2YxMWUyYmEzNzIzYzRmZGY5MmRhNjVhZjgyYTg2ZDFiY2FhNjg4Mjg4N2YwNDA1Nzk4ZGJmNmM5ZGYiLCJhbGxvY2F0aW9uX2lkIjoiZjQ0ZTkwNmNkNWU5MDNjMjk0OTczMzcwMjFjNzhiZDk4NzdhNTc1ZWQ0OWMyMjRhYzgxODM1MmMwZmRhYzc2YyIsImZpbGVfcGF0aF9oYXNoIjoiY2EwNTFmZDdlYjZmYmVjN2E5MmIyNjEzMTkxYWU3ZjA1OGZhMWE5MGQ2MWJhYjgwMzAxMmUwNzc4MjNhZTk3YiIsImFjdHVhbF9maWxlX2hhc2giOiIiLCJmaWxlX25hbWUiOiJ6dXMtYXNzZXRzIiwicmVmZXJlbmNlX3R5cGUiOiJkIiwiZXhwaXJhdGlvbiI6MCwidGltZXN0YW1wIjoxNjg1ODIwNzQzLCJlbmNyeXB0ZWQiOmZhbHNlLCJzaWduYXR1cmUiOiI5ZDJmNzViN2E5N2I0MTU4OWFiZDkwODc3MzBjNTA4MGI3MzIyNjY5ZWRhY2MwYTgxYWJmZWE4NWY5ODcwZDE5In0=",
            "d614b59ec44388f1b51e3de9072f7ebd809ccd228dbb4185bcb9e26ff6ea9f44",
            false,
            10,
            "downloadCallback"
        );
        console.log("downloaded file", file);
    
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
    
        a.href = file.url;
        a.download = file.fileName;
        a.click();
        window.URL.revokeObjectURL(file.url);
        document.body.removeChild(a);
})();
