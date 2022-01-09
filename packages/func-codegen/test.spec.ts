import {readFile} from "fs/promises";
import {SmartContract} from "ton-contract-executor";
import {buildDataCell} from "../nft/trc721/trc721.data";
import {Cell, Slice} from "ton";
import {compileFunc} from "ton-compiler";

describe('SmartContract', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./packages/func-codegen/test.fc')).toString('utf-8')
    })

    it('should return name', async () => {
        let dataCell = new Cell()
        let rrr = await compileFunc(source)
        console.log(rrr)
        let contract = await SmartContract.fromFuncSource(source, dataCell, { getMethodsMutate: true })

        let res = await contract.invokeGetMethod('main', [])
        console.log(res)

        let out = res.result[0] as Cell
        let slice = Slice.fromCell(out)
        console.log(slice.readUintNumber(256))
        console.log(slice.readUintNumber(256))
        console.log(slice.readUintNumber(256))
        let inner = slice.readRef()

        console.log(inner.readUintNumber(256))
        console.log(inner.readRef().readUintNumber(256))
    })
})