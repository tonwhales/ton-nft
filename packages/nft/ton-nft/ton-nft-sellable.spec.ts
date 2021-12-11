import {
    Address,
    Cell,
    CellMessage, CommentMessage,
    ExternalMessage,
    InternalMessage,
    Slice
} from "ton";
import {readFile} from "fs/promises";
import BN from "bn.js";
import {OutAction, parseActionsList, SendMsgOutAction} from "../../utils/parseActionsList";
import {SmartContract} from "ton-contract-executor";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const contractAddress = Address.parseFriendly('Ef-KJp9REa0zDgaM6f3JW--e9gKDg1_udGBtzUVtTahmoY3t').address
const ownerAndCreator = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address
const feesDestination = Address.parseFriendly('EQC6Nlpu1tNo-CsptnBN98xJw7IzGzY_Utqo6Sbfc8uNVKwt').address
const royaltiesDestination = Address.parseFriendly('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N').address
const bidderAddress = Address.parseFriendly('Ef_mlXHnufWO3-vvopflR_NpIFMiidvp_xt20Qf8usMBBKzB').address
const ZERO_ADDRESS = new Address(-1, Buffer.alloc(256 / 8))

const ONE_TON = 1_000_000_000

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

function parseBasicNftMetadataResponse(cell: Cell) {
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

function parseSalesInfoResponse(cell: Cell) {
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

const DefaultNftConfig: NftConfig = {
    name: 'Test',
    symbol: 'nft',
    content: 'content',
    creator: ownerAndCreator,
    owner: ownerAndCreator,

    isOnSale: false,
    isLastBidHistorical: false,
    lastBidValue: 0,
    lastBidder: ZERO_ADDRESS,
    feesPercent: 10,
    feesDestination: feesDestination,
    royaltiesPercent: 10,
    royaltiesDestination: royaltiesDestination
}

const TVM_TRUE = new BN(-1)
const TVM_FALSE = new BN(0)

async function getBasicNftMetadata(contract: SmartContract) {
    let res = await contract.invokeGetMethod('get_nft_basic_info', [])
    expect(res.result[0]).toBeInstanceOf(Cell)
    return parseBasicNftMetadataResponse(res.result[0] as Cell)
}

async function getBasicNftSalesInfo(contract: SmartContract) {
    let res = await contract.invokeGetMethod('get_nft_sales_info', [])
    expect(res.result[0]).toBeInstanceOf(Cell)
    return parseSalesInfoResponse(res.result[0] as Cell)
}



type NormalizedStackEntry =
    | null
    | Cell
    | Slice
    | BN
    | NormalizedStackEntry[]

function testAddress(res: NormalizedStackEntry[], exceptedAddress: Address) {
    expect(res.length).toBe(2)
    expect(res[0]).toBeInstanceOf(BN)
    expect(res[1]).toBeInstanceOf(BN)

    let [wc, address] = res as [BN, BN]

    expect(wc.eqn(exceptedAddress.workChain)).toBe(true)
    expect(address.eq(new BN(exceptedAddress.hash))).toBe(true)
}

function testOkResponse(res: OutAction, exceptedAddress: Address) {
    expect(res.type).toEqual('send_msg')
    if (res.type !== 'send_msg') {
        return
    }
    expect(res.message.info.dest!.toFriendly()).toEqual(exceptedAddress.toFriendly())
    let slice = Slice.fromCell(res.message.body)
    expect(slice.readUint(32).toNumber()).toEqual(0xef6b6179)
}

describe('TON Sellable NFT', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./packages/nft/ton-nft/ton-nft-sellable.fc')).toString('utf-8')
    })

    it('should return basic nft metadata', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))
        let res = await contract.invokeGetMethod('get_nft_basic_info', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        let metadata = parseBasicNftMetadataResponse(res.result[0] as Cell)

        expect(metadata.name).toEqual(DefaultNftConfig.name)
        expect(metadata.symbol).toEqual(DefaultNftConfig.symbol)
        expect(metadata.creator.toFriendly()).toEqual(DefaultNftConfig.creator.toFriendly())
        expect(metadata.owner.toFriendly()).toEqual(DefaultNftConfig.owner.toFriendly())
        expect(metadata.content).toEqual(DefaultNftConfig.content)
    })

    it('should return sales info', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))
        let res = await contract.invokeGetMethod('get_nft_sales_info', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        let info = parseSalesInfoResponse(res.result[0] as Cell)

        expect(info.isOnSale).toEqual(DefaultNftConfig.isOnSale)
        expect(info.isLastBidHistorical).toEqual(DefaultNftConfig.isLastBidHistorical)
        expect(info.lastBidValue).toEqual(DefaultNftConfig.lastBidValue)
        expect(info.lastBidder.toFriendly()).toEqual(DefaultNftConfig.lastBidder.toFriendly())
        expect(info.feesPercent).toEqual(DefaultNftConfig.feesPercent)
        expect(info.feesDestination.toFriendly()).toEqual(DefaultNftConfig.feesDestination.toFriendly())
        expect(info.royaltiesPercent).toEqual(DefaultNftConfig.royaltiesPercent)
        expect(info.royaltiesDestination.toFriendly()).toEqual(DefaultNftConfig.royaltiesDestination.toFriendly())
    })

    it('should support interfaces', async () => {
        const BASIC_NFT_INTERFACE = new BN(126808)
        const BASIC_INTROSPECTION_INTERFACE = new BN(81264)

        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))
        let res = await contract.invokeGetMethod('supported_interfaces', [])

        expect(res.result).toContainEqual(BASIC_NFT_INTERFACE)
        expect(res.result).toContainEqual(BASIC_INTROSPECTION_INTERFACE)
    })

    it('should gift nft', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))

        let newOwner = '0:fcb91a3a3816d0f7b8c2c76108b8a9bc5a6b7a55bd79f8ab101c52db29232260'

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 32)
        bodyCell.refs.push(stringToCell('giftTo:' + newOwner))

        let msg = new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CellMessage(bodyCell)
        })

        // Check current owner
        let {owner} = await getBasicNftMetadata(contract)
        expect(owner.toFriendly()).toEqual(ownerAndCreator.toFriendly())

        // Gift nft
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toBe(0)

        // Check new owner
        let newOwnerAddress = Address.parseRaw(newOwner)
        owner = (await getBasicNftMetadata(contract)).owner
        expect(owner.toFriendly()).toEqual(newOwnerAddress.toFriendly())
    })

    it('should check owner when gifting nft', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))

        let someAddress = Address.parseFriendly('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D').address
        let newOwner = '0:fcb91a3a3816d0f7b8c2c76108b8a9bc5a6b7a55bd79f8ab101c52db29232260'

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 32)
        bodyCell.refs.push(stringToCell('giftTo:' + newOwner))

        let msg = new InternalMessage({
            to: someAddress,
            from: someAddress,
            value: new BN(0),
            bounce: false,
            body: new CellMessage(bodyCell)
        })

        // Gift nft
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toBe(400)
    })

    it('should handle external init message', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 1)

        let msg = new ExternalMessage({
            to: ownerAndCreator,
            from: ownerAndCreator,
            body: new CellMessage(bodyCell)
        })

        let res = await contract.sendExternalMessage(msg)
        expect(res.exit_code).toBe(0)
    })

    //
    //  Sales
    //

    it('should enable selling', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))

        // Check is on sale
        let {isOnSale} = await getBasicNftSalesInfo(contract)
        expect(isOnSale).toEqual(false)

        // Enable selling
        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel+')
        }))
        expect(res.exit_code).toEqual(0)
        let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))
        expect(actions).toHaveLength(1)
        testOkResponse(actions[0], ownerAndCreator)
        // Re-check is on sale
        isOnSale = (await getBasicNftSalesInfo(contract)).isOnSale
        expect(isOnSale).toBe(true)
    })

    it('should enable selling only when owner calls', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultNftConfig))

        // Check is on sale
        let {isOnSale} = await getBasicNftSalesInfo(contract)
        expect(isOnSale).toBe(false)

        //  Enable selling
        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ZERO_ADDRESS,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel+')
        }))
        expect(res.exit_code).not.toBe(0)

        // Re-check is on sale
        expect((await getBasicNftSalesInfo(contract)).isOnSale).toBe(false)
    })

    it('should not enable selling if already on sale', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell({...DefaultNftConfig, isOnSale: true}))

        // Check is on sale
        expect((await getBasicNftSalesInfo(contract)).isOnSale).toBe(true)

        //  Enable selling
        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel+')
        }))
        expect(res.exit_code).not.toBe(0)
    })

    it('should place a bid', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell({...DefaultNftConfig, isOnSale: true}))

        let msg = new InternalMessage({
            to: contractAddress,
            from: bidderAddress,
            value: new BN(ONE_TON * 3),
            bounce: false,
            body: new CommentMessage('pbid')
        })

        // Place a bid
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toEqual(0)
        expect(parseActionsList(Slice.fromCell(res.action_list_cell!))).toHaveLength(0)

        // Check new bid value
        expect((await getBasicNftSalesInfo(contract)).lastBidValue).toBe(ONE_TON * 2)

        // Check new bidder address
        expect((await getBasicNftSalesInfo(contract)).lastBidder.toFriendly()).toBe(bidderAddress.toFriendly())

        msg = new InternalMessage({
            to: contractAddress,
            from: bidderAddress,
            value: new BN(ONE_TON * 4),
            bounce: false,
            body: new CommentMessage('pbid')
        })

        // Place second a bid
        res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toEqual(0)
        let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))

        // Check bid value
        expect((await getBasicNftSalesInfo(contract)).lastBidValue).toBe(ONE_TON * 3)

        // Should return previous bid to previous bidder
        expect(actions).toHaveLength(1)
        let action = actions[0] as SendMsgOutAction
        expect(action.message.info.dest!.toFriendly()).toEqual(bidderAddress.toFriendly())
        expect(action.message.info.type).toEqual('internal')
        if (action.message.info.type === 'internal') {
            // Minus 1 ton for fees
            expect(action.message.info.value.coins.toNumber()).toEqual(ONE_TON * 2)
        }

        // Check new bid value
        expect((await getBasicNftSalesInfo(contract)).lastBidValue).toBe(ONE_TON * 3)

        // Check new bidder address
        expect((await getBasicNftSalesInfo(contract)).lastBidder.toFriendly()).toBe(bidderAddress.toFriendly())
    })

    it('should disable selling', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell({
            ...DefaultNftConfig,
            isOnSale: true,
            isLastBidHistorical: true
        }))

        // Check is on sale
        expect((await getBasicNftSalesInfo(contract)).isOnSale).toBe(true)

        //  Disable selling
        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel-')
        }))
        expect(res.exit_code).toEqual(0)
        // let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))
        // expect(actions).toHaveLength(1)
        // testOkResponse(actions[0], ownerAndCreator)

        // Re-check is on sale
        expect((await getBasicNftSalesInfo(contract)).isOnSale).toBe(false)
    })

    it('should return last bid value to bidder when disabling sale', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell({...DefaultNftConfig, isOnSale: true}))

        let msg = new InternalMessage({
            to: contractAddress,
            from: bidderAddress,
            value: new BN(ONE_TON * 3),
            bounce: false,
            body: new CommentMessage('pbid')
        })

        // Place a bid
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toBe(0)

        //  Disable selling
        res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel-')
        }))
        let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))

        expect(actions).toHaveLength(1)
        let action = actions[0] as SendMsgOutAction
        expect(action.message.info.dest!.toFriendly()).toEqual(bidderAddress.toFriendly())
        expect(action.message.info.type).toEqual('internal')
        if (action.message.info.type === 'internal') {
            // Minus 1 ton for fees
            expect(action.message.info.value.coins.toNumber()).toEqual(ONE_TON * 2)
        }

        // Last bid should marked as historical after sale disable
        expect((await getBasicNftSalesInfo(contract)).isLastBidHistorical).toBe(true)
    })

    it('should not return last bid value to bidder when disabling sale if bid is historical', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell({
            ...DefaultNftConfig,
            isOnSale: true,
            isLastBidHistorical: true
        }))

        //  Disable selling
        let res = await contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('sel-')
        }))
        expect(res.exit_code).toEqual(0)

        let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))
        expect(actions).toHaveLength(0)
    })

    it('should accept bid', async () => {
        const feesPercent = 15
        const royaltiesPercent = 15

        let contract = await SmartContract.fromFuncSource(source, buildDataCell({
            ...DefaultNftConfig,
            isOnSale: true,
            feesPercent,
            royaltiesPercent
        }))

        let bid = ONE_TON * 2

        let msg = new InternalMessage({
            to: contractAddress,
            from: bidderAddress,
            value: new BN(bid + ONE_TON),
            bounce: false,
            body: new CommentMessage('pbid')
        })

        // Place a bid
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toEqual(0)
        expect(parseActionsList(Slice.fromCell(res.action_list_cell!))).toHaveLength(0)

        // Accept last bid
        msg = new InternalMessage({
            to: contractAddress,
            from: ownerAndCreator,
            value: new BN(0),
            bounce: false,
            body: new CommentMessage('acpt')
        })
        res = await contract.sendInternalMessage(msg)
        let actions = parseActionsList(Slice.fromCell(res.action_list_cell!))
        expect(actions).toHaveLength(3)

        let fees = bid / 100 * feesPercent
        let royalties = bid / 100 * royaltiesPercent
        let remaining = bid - fees - royalties


        let feesMessageValue!: BN
        let royaltiesMessageValue!: BN
        let ownerMessageValue!: BN

        for (let action of actions) {
            if (action.type === 'send_msg' && action.message.info.type === 'internal') {
                if (action.message.info.dest!.toFriendly() === feesDestination.toFriendly()) {
                    feesMessageValue = action.message.info.value.coins
                }
                if (action.message.info.dest!.toFriendly() === royaltiesDestination.toFriendly()) {
                    royaltiesMessageValue = action.message.info.value.coins
                }
                if (action.message.info.dest!.toFriendly() === ownerAndCreator.toFriendly()) {
                    ownerMessageValue = action.message.info.value.coins
                }
            }
        }

        expect(feesMessageValue).not.toBeUndefined()
        expect(royaltiesMessageValue).not.toBeUndefined()
        expect(ownerMessageValue).not.toBeUndefined()

        expect(feesMessageValue).toEqual(new BN(fees))
        expect(royaltiesMessageValue).toEqual(new BN(royalties))
        expect(ownerMessageValue).toEqual(new BN(remaining))
    })
})