import {Address, Cell, TonClient} from "ton";
import {TonNftSellable} from "./TonNftSellable";

async function main() {
    let client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
    })


    const address = Address.parseFriendly('EQDTS_h6w6LkUAl7m1TMuLQ6G9JE0poJ1gXaCStZsqU4bife').address
    // let state = await client.getContractState(address)
    // console.log(state.data!.toString('base64'))
    let nft = new TonNftSellable(client, address)

    console.log('getBasicInfo', await nft.getBasicInfo())
    console.log('getSalesInfo', await nft.getSalesInfo())
    console.log('getSupportedInterfaces', await nft.getSupportedInterfaces())

}

main()