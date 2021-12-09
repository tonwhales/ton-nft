import {Cell} from "ton";
import {SmartContract} from "../../contract-executor/SmartContract";
import {readFile} from "fs/promises";
import BN from "bn.js";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

function buildDataCell(name: string, symbol: string, supply: number) {
    let dataCell = new Cell()
    dataCell.bits.writeUint(1, 1)       // inited
    dataCell.refs.push(stringToCell(name))              // name
    dataCell.refs.push(stringToCell(symbol))            // symbol
    dataCell.bits.writeUint(supply, 256)      // supply
    dataCell.bits.writeUint(0, 1)       // content empty dict
    dataCell.bits.writeUint(0, 1)       // owners empty dict

    return dataCell
}

describe('SmartContract', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ERC721/ton-erc721.fc')).toString('utf-8')
    })

    it('should return name', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 100))
        let res = await contract.invokeGetMethod('name', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        expect((res.result[0] as Cell).toString()).toEqual(stringToCell('Test').toString())
    })

    it('should return symbol', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 100))
        let res = await contract.invokeGetMethod('symbol', [])
        expect(res.result[0]).toBeInstanceOf(Cell)
        expect((res.result[0] as Cell).toString()).toEqual(stringToCell('nft').toString())
    })

    it('should return supply', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell('Test', 'nft', 100))
        let res = await contract.invokeGetMethod('total_supply', [])
        expect(res.result[0]).toBeInstanceOf(BN)
        expect((new BN(100)).eq(res.result[0] as BN)).toBe(true)
    })
})