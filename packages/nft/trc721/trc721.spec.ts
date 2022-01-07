import {Address, Cell} from "ton";
import {readFile} from "fs/promises";
import BN from "bn.js";
import {SmartContract} from "ton-contract-executor";
import {buildDataCell, stringToCell, Trc721Config} from "./trc721.data";
import {Trc721Debug} from "./Trc721Debug";
import {parseActionsList} from "../../utils/parseActionsList";

const myAddress = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

const DefaultConfig: Trc721Config = {
    name: 'Test',
    symbol: 'nft',
    totalSupply: 0
}

describe('SmartContract', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./packages/nft/trc721/trc721.fc')).toString('utf-8')
    })

    it('should return name', async () => {
        let contract = await Trc721Debug.create(DefaultConfig)
        expect(await contract.getName()).toEqual(DefaultConfig.name)
    })

    it('should return symbol', async () => {
        let contract = await Trc721Debug.create(DefaultConfig)
        expect(await contract.getSymbol()).toEqual(DefaultConfig.symbol)
    })

    it('should return supply', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell(DefaultConfig))
        let res = await contract.invokeGetMethod('total_supply', [])
        expect(res.result[0]).toBeInstanceOf(BN)
        expect((new BN(0)).eq(res.result[0] as BN)).toBe(true)
    })

    // it('should mint token', async () => {
    //     let contract = await Trc721Debug.create(DefaultConfig)
    //
    //
    //     let res = await contract.mint(myAddress, 'test-uri')
    //     expect(res.exit_code).toBe(0)
    //
    //     let uri = await contract.getTokenUri(1)
    //     expect(uri).toBe('test-uri')
    //
    //     expect((await contract.getSupply())).toBe(1)
    //
    //     expect((await contract.getOwner(1)).toFriendly()).toEqual(myAddress.toFriendly())
    // })

    it('should mint token 2', async () => {
        let contract = await Trc721Debug.create(DefaultConfig)


        let res = await contract.mint2(myAddress, 'test-uri')
        expect(res.exit_code).toBe(0)

        let actions = parseActionsList(res.action_list_cell!)

        console.log(actions)

        let uri = await contract.getTokenUri(1)
        expect(uri).toBe('test-uri')

        expect((await contract.getSupply())).toBe(1)

        expect((await contract.getOwner(1)).toFriendly()).toEqual(myAddress.toFriendly())
    })


})