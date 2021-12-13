import {Address, Cell, Slice} from "ton";

export type NftConfig = {
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

export const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

export function buildDataCell(config: NftConfig) {
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
    salesCell.bits.writeUint(isOnSale ? 1 : 0, 1)                   // is_on_sale
    salesCell.bits.writeUint(isLastBidHistorical ? 1 : 0, 1)        // is_last_bid_historical
    salesCell.bits.writeCoins(lastBidValue)                                         // last_bid_value
    salesCell.bits.writeAddress(lastBidder)                                         // last_bidder
    salesCell.bits.writeUint(feesPercent, 8)                                // fees_percent
    salesCell.bits.writeAddress(feesDestination)                                    // fees_destination
    salesCell.bits.writeUint(royaltiesPercent, 8)                           // royalties_percent
    salesCell.bits.writeAddress(royaltiesDestination)                               // royalties_destination

    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)           // inited
    dataCell.refs.push(metadataCell)                        // metadata
    dataCell.bits.writeAddress(creator)                     // creator
    dataCell.bits.writeAddress(owner)                       // owner
    dataCell.refs.push(stringToCell(content))               // content
    dataCell.refs.push(salesCell)                           // sales_cell

    return dataCell
}

export function parseBasicNftMetadataResponse(cell: Cell) {
    let slice = Slice.fromCell(cell)

    let metadata = slice.readRef()

    let nameLen = metadata.readUint(10).toNumber()
    let name = metadata.readBuffer(nameLen).toString()

    let symbolLen = metadata.readUint(10).toNumber()
    let symbol = metadata.readBuffer(symbolLen).toString()

    let creator = slice.readAddress()!
    let owner = slice.readAddress()!
    let contentSlice = slice.readRef()

    let contentBits = contentSlice.toCell().bits
    let content = contentBits.buffer.slice(0, Math.ceil(contentBits.cursor / 8)).toString()

    return {
        name,
        symbol,

        creator,
        owner,
        content
    }
}

export function parseSalesInfoResponse(cell: Cell) {
    let slice = Slice.fromCell(cell)

    let isOnSale = slice.readUint(1).toNumber() === 1
    let isLastBidHistorical = slice.readUint(1).toNumber() === 1
    let lastBidValue = slice.readCoins().toNumber()
    let lastBidder = slice.readAddress()!
    let feesPercent = slice.readUint(8).toNumber()
    let feesDestination = slice.readAddress()!
    let royaltiesPercent = slice.readUint(8).toNumber()
    let royaltiesDestination = slice.readAddress()!

    return {
        isOnSale,
        isLastBidHistorical,
        lastBidValue,
        lastBidder,
        feesPercent,
        feesDestination,
        royaltiesPercent,
        royaltiesDestination
    }
}