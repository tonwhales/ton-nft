import {Address, Cell, CellMessage, ExternalMessage, InternalMessage} from "ton";
import {SmartContract} from "../../contract-executor/SmartContract";
import {readFile} from "fs/promises";
import BN from "bn.js";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const ownerAndCreator = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

function buildDataCell(name: string, symbol: string, content: string) {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)         // inited
    dataCell.refs.push(stringToCell(name))              // name
    dataCell.refs.push(stringToCell(symbol))            // symbol
    dataCell.bits.writeAddress(ownerAndCreator)         // creator
    dataCell.bits.writeAddress(ownerAndCreator)         // owner
    dataCell.refs.push(stringToCell(content))           // content
    dataCell.bits.writeUint(0, 32)      // seq

    return dataCell
}

describe('TON NFT', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ton-nft/ton-nft.fc')).toString('utf-8')
    })

    it('should return name', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('get_name', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        expect((res.result[0] as Cell).toString()).toEqual(stringToCell('Test').toString())
    })

    it('should return symbol', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('get_symbol', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        expect((res.result[0] as Cell).toString()).toEqual(stringToCell('nft').toString())
    })

    it('should return creator', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('get_creator', [])

        expect(res.result.length).toBe(2)
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[1]).toBeInstanceOf(BN)

        let [wc, address] = res.result as [BN, BN]

        expect(wc.eqn(ownerAndCreator.workChain)).toBe(true)
        expect(address.eq(new BN(ownerAndCreator.hash))).toBe(true)
    })

    it('should return owner', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('get_owner', [])

        expect(res.result.length).toBe(2)
        expect(res.result[0]).toBeInstanceOf(BN)
        expect(res.result[1]).toBeInstanceOf(BN)

        let [wc, address] = res.result as [BN, BN]

        expect(wc.eqn(ownerAndCreator.workChain)).toBe(true)
        expect(address.eq(new BN(ownerAndCreator.hash))).toBe(true)
    })

    it('should return content', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('get_content', [])

        expect(res.result[0]).toBeInstanceOf(Cell)
        expect((res.result[0] as Cell).toString()).toEqual(stringToCell('content').toString())
    })

    it('should return current seqno', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('seqno', [])

        expect(res.result[0]).toBeInstanceOf(BN)
        expect((res.result[0] as BN).eqn(0)).toBe(true)
    })

    it('should support interfaces', async () => {
        const BASIC_NFT_INTERFACE = new BN(126808)
        const BASIC_INTROSPECTION_INTERFACE = new BN(81264)

        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))
        let res = await contract.invokeGetMethod('supported_interfaces', [])

        expect(res.result).toContainEqual(BASIC_NFT_INTERFACE)
        expect(res.result).toContainEqual(BASIC_INTROSPECTION_INTERFACE)
    })

    it('should gift nft', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))

        let contractAddress = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address
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
        let owner = await contract.invokeGetMethod('get_owner', [])

        expect(owner.result.length).toBe(2)
        expect(owner.result[0]).toBeInstanceOf(BN)
        expect(owner.result[1]).toBeInstanceOf(BN)

        let [wc, address] = owner.result as [BN, BN]

        expect(wc.eqn(ownerAndCreator.workChain)).toBe(true)
        expect(address.eq(new BN(ownerAndCreator.hash))).toBe(true)

        // Gift nft
        let res = await contract.sendInternalMessage(msg)

        // Check new owner
        let newOwnerAddress = Address.parseRaw(newOwner)
        owner = await contract.invokeGetMethod('get_owner', [])

        expect(owner.result.length).toBe(2)
        expect(owner.result[0]).toBeInstanceOf(BN)
        expect(owner.result[1]).toBeInstanceOf(BN)

        let [newWc, newAddress] = owner.result as [BN, BN]

        expect(newWc.eqn(newOwnerAddress.workChain)).toBe(true)
        expect(newAddress.eq(new BN(newOwnerAddress.hash))).toBe(true)
    })

    it('should check owner when gifting nft', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))

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
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 'content'))

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 1)

        let msg = new ExternalMessage({
            to: ownerAndCreator,
            from: ownerAndCreator,
            body: new CellMessage(bodyCell)
        })

        let res = await contract.sendExternalMessage(msg)
        expect(res.exit_code).toBe(0)

        console.log(ownerAndCreator.workChain + ':' + ownerAndCreator.hash.toString('hex'))
    })
})