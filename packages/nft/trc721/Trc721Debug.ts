import {readFile} from "fs/promises";
import {SmartContract} from "ton-contract-executor";
import {buildDataCell, stringToCell, Trc721Config} from "./trc721.data";
import {Address, Cell, CellMessage, InternalMessage, Slice} from "ton";
import BN from "bn.js";

function sliceToString(s: Slice) {
    let data = s.readRemaining()
    return data.buffer.slice(0, Math.ceil(data.cursor / 8)).toString()
}

const contractAddress = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t')

export class Trc721Debug {
    private constructor(public readonly contract: SmartContract) {

    }

    async mint(minter: Address, tokenUri: string) {
        let wc = new BN(minter.workChain)
        let address = new BN(minter.hash)

        return await this.contract.invokeGetMethod('mint', [
            { type: 'int', value: wc.toString(10) },
            { type: 'int', value: address.toString(10) },
            { type: 'cell', value: (await stringToCell(tokenUri).toBoc({ idx: false })).toString('base64') },
        ])
    }

    async getTokenUri(tokenId: number) {
        let res = await this.contract.invokeGetMethod('token_uri', [{ type: 'int', value: tokenId.toString() }])
        let uriSlice = res.result[0] as Slice
        return sliceToString(uriSlice)
    }

    async getSupply() {
        let res = await this.contract.invokeGetMethod('total_supply', [])
        return (res.result[0] as BN).toNumber()
    }

    async getOwner(tokenId: number) {
        let res = await this.contract.invokeGetMethod('owner_of', [{ type: 'int', value: tokenId.toString() }])
        let wc = res.result[0] as BN
        let address = res.result[1] as BN

        return new Address(wc.toNumber(), address.toBuffer())
    }

    async getName() {
        let res = await this.contract.invokeGetMethod('name', [])
        return sliceToString(Slice.fromCell(res.result[0] as Cell))
    }

    async getSymbol() {
        let res = await this.contract.invokeGetMethod('symbol', [])
        return sliceToString(Slice.fromCell(res.result[0] as Cell))
    }

    async mint2(minter: Address, tokenUri: string) {

        let messageBody = new Cell()


        messageBody.bits.writeUint(1, 32) // op
        messageBody.bits.writeUint(1, 64) // query_id
        messageBody.refs.push(stringToCell(tokenUri))    // token_uri

        let res = await this.contract.sendInternalMessage(new InternalMessage({
            to: contractAddress,
            from: minter,
            value: new BN(1),
            bounce: false,
            body: new CellMessage(messageBody)
        }))


        console.log(res)
        return res
    }

    static async create(config: Trc721Config) {
        let source = (await readFile('./packages/nft/trc721/trc721.fc')).toString('utf-8')
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(config), { getMethodsMutate: true })

        return new Trc721Debug(contract)
    }
}