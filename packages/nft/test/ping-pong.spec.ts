import {readFile} from "fs/promises";
import {SmartContract} from "../../contract-executor/SmartContract";
import {Address, Cell, CellMessage, ExternalMessage, InternalMessage, Slice} from "ton";
import BN from "bn.js";
import {parseActionsList} from "../../utils/parseActionsList";

function buildDataCell() {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)        // inited

    return dataCell
}

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

let contractAddress = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

//  Try 1
//  0.1 gas
//  100000000:1:
//  returned 0.1
//  fess was payed from smc balance
//
//  Try 2
//  0.01 gas
//  0:64:
//  returned 0.0035
//  fess was payed from original message
//
//  Try 3
//  0.01 gas
//  0:65:
//  returned 0.01
//  fess was payed from smc balance
//
//
// 0.2572
// 0.2479
// 0.0093

//  0.2479
// 0.2386


describe('ping-pong smc', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/test/ping-pong.fc')).toString('utf-8')
    })

    it('should handle internal message', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell())



        let value = 123
        let mode = 1

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 32)
        bodyCell.writeCell(stringToCell(`${value}:${mode}:r1:8:`))

        let msg = new InternalMessage({
            to: contractAddress,
            from: contractAddress,
            value: new BN(0),
            bounce: false,
            body: new CellMessage(bodyCell)
        })

        // 0.145
        // 0.195

        // Place a bid
        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toEqual(0)

        console.log(res.result.map(v => (v as BN).toNumber()))
        // expect((res.result[0] as BN).toNumber()).toEqual(value)
        // expect((res.result[1] as BN).toNumber()).toEqual(mode)
    })

    it('should handle external init message', async () => {
        let contract = await SmartContract.fromFuncSource(source, buildDataCell())

        let bodyCell = new Cell()
        bodyCell.bits.writeUint(0, 1)

        let msg = new ExternalMessage({
            to: contractAddress,
            from: contractAddress,
            body: new CellMessage(bodyCell)
        })

        let res = await contract.sendExternalMessage(msg)
        expect(res.exit_code).toBe(0)
    })
})