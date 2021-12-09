import {Address, Cell, ContractSource, TonClient} from "ton";
import {compileFunc} from "ton-compiler";
import {readFile} from "fs/promises";
import {contractAddress} from "ton/dist/contracts/sources/ContractSource";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const ZERO_ADDRESS = new Address(-1, Buffer.alloc(256/8))
const ownerAndCreator = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

type NftConfig = {
    name: string
    symbol: string
    content: string
    creator: Address
    owner: Address

    isOnSale: boolean
    isLastBidHistorical: boolean
    lastBidValue: number
    lastBidder: Address
    feesPercent: number
    feesDestination: Address
    royaltiesPercent: number
    royaltiesDestination: Address
}

function buildDataCell(config: NftConfig) {
    let {
        name,
        symbol,
        content,
        creator,
        owner,

        isOnSale,
        isLastBidHistorical,
        lastBidValue,
        lastBidder,
        feesPercent,
        feesDestination,
        royaltiesPercent,
        royaltiesDestination
    } = config

    let metadataCell = new Cell()
    metadataCell.bits.writeUint(name.length, 10)        // name_len
    metadataCell.bits.writeString(name)                          // name
    metadataCell.bits.writeUint(symbol.length, 10)      // symbol_len
    metadataCell.bits.writeString(symbol)                        // symbol

    let salesCell = new Cell()
    salesCell.bits.writeUint(isOnSale ? 1 : 0, 1)          // is_on_sale
    salesCell.bits.writeUint(isLastBidHistorical ? 1 : 0, 1)          // is_last_bid_historical
    salesCell.bits.writeCoins(lastBidValue)                    // last_bid_value
    salesCell.bits.writeAddress(lastBidder)               // last_bidder
    salesCell.bits.writeUint(feesPercent, 8)         // fees_percent
    salesCell.bits.writeAddress(feesDestination)            // fees_destination
    salesCell.bits.writeUint(royaltiesPercent, 8)         // royalties_percent
    salesCell.bits.writeAddress(royaltiesDestination)       // royalties_destination

    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)        // inited
    dataCell.refs.push(metadataCell)                    // metadata
    dataCell.bits.writeAddress(creator)         // creator
    dataCell.bits.writeAddress(owner)         // owner
    dataCell.refs.push(stringToCell(content))           // content
    dataCell.refs.push(salesCell)                       // sales_cell

    return dataCell
}

async function deploy() {
    let funcSource = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ton-nft/ton-nft-sellable.fc')).toString('utf-8')
    let source = await compileFunc(funcSource)
    let sourceCell = Cell.fromBoc(source.cell)[0]
    let dataCell = buildDataCell({
        name: 'First sellable NFT',
        symbol: 'FIRST_SELLABLE',
        content: 'https://t.me/narek',
        creator: ownerAndCreator,
        owner: ownerAndCreator,

        isOnSale: false,
        isLastBidHistorical: true,
        lastBidValue: 0,
        lastBidder: ZERO_ADDRESS,
        feesPercent: 10,
        feesDestination: ownerAndCreator,
        royaltiesPercent: 10,
        royaltiesDestination: ownerAndCreator
    })

    let contractSource: ContractSource = {
        initialCode: sourceCell,
        initialData: dataCell,
        workchain: 0,
        type: '',
        backup: () => '',
        describe: () => 'nft'
    }

    let address = await contractAddress(contractSource)

    console.log('contrct address', address)

    let client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
    })

    let msgCell = new Cell()
    msgCell.bits.writeUint(0, 1)

    await client.sendExternalMessage(
        {
            address,
            source: contractSource
        },
        msgCell
    )

    console.log('Init message was sent to', address)
}

deploy()