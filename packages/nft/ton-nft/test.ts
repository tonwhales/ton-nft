import {Address, TonClient} from "ton";
import {TonNftSellable} from "./TonNftSellable";

async function main() {
    let client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
    })
    const address = Address.parseFriendly('EQC3PpSnA0cxSx-J6o1NJ_rzPcYsByLn3poGbDFY6KRb_-z0').address
    let nft = new TonNftSellable(client, address)

    console.log('getBasicInfo', await nft.getBasicInfo())
    console.log('getSalesInfo', await nft.getSalesInfo())
    console.log('getSupportedInterfaces', await nft.getSupportedInterfaces())

}

main()