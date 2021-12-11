import {readFile} from "fs/promises";
import {Address, Cell, CellMessage, ExternalMessage, InternalMessage, Slice} from "ton";
import BN from "bn.js";
import {SmartContract} from "ton-contract-executor";

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

describe('ping-pong smc', () => {
    let source: string

    beforeAll(async () => {
        source = (await readFile('./packages/nft/ping-pong/ping-pong.fc')).toString('utf-8')
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

        let res = await contract.sendInternalMessage(msg)
        expect(res.exit_code).toEqual(0)
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