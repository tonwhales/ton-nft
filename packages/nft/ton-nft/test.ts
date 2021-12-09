import {Address, TonClient} from "ton";
import {TonNftSellable} from "./TonNftSellable";

async function main() {
    let client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
    })
    const address = Address.parseFriendly('EQCcNVbR_evmZzv9KESmb59CsenPz4ZPkS6LfvPacFfeDVAL').address
    let nft = new TonNftSellable(client, address)

    console.log('getName', await nft.getName())
    console.log('getSymbol', await nft.getSymbol())
    console.log('getContent', await nft.getContent())
    console.log('getCreator', await nft.getCreator())
    console.log('getOwner', await nft.getOwner())
    console.log('getIsOnSale', await nft.getIsOnSale())
    console.log('getIsLastBidHistorical', await nft.getIsLastBidHistorical())
    console.log('getLastBidValue', await nft.getLastBidValue())
    console.log('getLastBidder', await nft.getLastBidder())
    console.log('getFeesPercent', await nft.getFeesPercent())
    console.log('getFeesDestination', await nft.getFeesDestination())
    console.log('getRoyaltiesPercent', await nft.getRoyaltiesPercent())
    console.log('getRoyaltiesDestination', await nft.getRoyaltiesDestination())
    console.log('getSupportedInterfaces', await nft.getSupportedInterfaces())

}

main()