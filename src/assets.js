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
    const { walletId, privateKey, publicKey } = keys
    await setWallet(walletId, privateKey, publicKey, mnemonic);
    const authTicket = "eyJjbGllbnRfaWQiOiIiLCJvd25lcl9pZCI6ImJmMzM5OWZiZjNkZjBkNGVhMGM5NWRjODNiNDQ5YjZhZDg4NDUxMzViNGI4OTcwOWYwYWFhMzQ5NzY1ZmM3YTMiLCJhbGxvY2F0aW9uX2lkIjoiZDI0ZDE2YmRkNjFlYWEwNGNiNWY4M2E3MjlhZTBmYmJhN2Q1NWZlZjU2Y2I5YmVmNGE3NTAxMWRiODNiZDJmNiIsImZpbGVfcGF0aF9oYXNoIjoiYTI5NTVjNjU4MDAxMzAwZDk3YzJiN2FiNzMzN2NlN2U5NmZiOGEyZWJiZmFjZjY1MWNhYTFkMzMwNWMxNWVjZiIsImFjdHVhbF9maWxlX2hhc2giOiIiLCJmaWxlX25hbWUiOiJuZXctYXNzZXRzLXRlc3QiLCJyZWZlcmVuY2VfdHlwZSI6ImQiLCJleHBpcmF0aW9uIjowLCJ0aW1lc3RhbXAiOjE2ODU5NjYwOTcsImVuY3J5cHRlZCI6ZmFsc2UsInNpZ25hdHVyZSI6IjE4MzEyZDkwNTBmNDg5MzRmMDc3MjBiOTc1ZTcyNjNiMTIwYWU2Yzk0ZTUyNDI5MzU4Nzg3MjBkOTgzYTIyOGIifQ=="
    const authData = await decodeAuthTicket(authTicket)
    const { data } = await listSharedFiles(authData?.file_path_hash, authData?.allocation_id, authData?.owner_id)
    const filesList = data?.list
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
        const element = document.getElementById(downloadedFile?.fileName.replace(/\.[^/.]+$/, ""))
        if(element){
            const imageUrl =  window.URL.createObjectURL(downloadedFile?.url);
            element.src = imageUrl
        }
    }
})();
