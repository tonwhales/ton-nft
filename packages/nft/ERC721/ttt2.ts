import {readFile} from "fs/promises";
import {Address, BinaryMessage, Cell, CommonMessageInfo, InternalMessage} from "ton";
import {SmartContract} from "../../contract-executor/SmartContract";
import BN from "bn.js";
// import {SmartContract} from 'ton-contract-executor'

async function main() {
    let source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ERC721/test.fc')).toString('utf-8')

    let dataCell = new Cell()
    dataCell.bits.writeUint(1, 32)       // seqno

    let contract = await SmartContract.fromFuncSource(source, dataCell, { getMethodsMutate: true })

    // for (let i = 0; i < 10; i++) {
    //     let res = await contract.invokeGetMethod('get_seq', [])
    //     console.log(res.stack[0])
    // }

    let res = await contract.invokeGetMethod('get_tuple', [])
    console.log(res)

    const address = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address
    let payloadBuff = Buffer.alloc(4)
    payloadBuff.writeUInt32BE(0xFFFFFFFF)
    let payload = new BinaryMessage(payloadBuff)

    let payloadCell = new Cell()

    payload.writeTo(payloadCell)
    let msg = new InternalMessage({
        from: address,
        to: address,
        value: 100,
        bounce: false,
        body: new CommonMessageInfo({ body: payload })
    })
    res = await contract.sendInternalMessage(msg)
    let [smc_balance, msg_value, msgg, msg_body] = res.result

    console.log('smc_balance', (smc_balance as BN).toString())
    console.log('msg_value', (msg_value as BN).toString())
    console.log('msgg', msgg)
    console.log('msg_body', msg_body)
    // console.log(res.stack[0])
    // console.log(7777, (res.stack[0] as any).value)
    // let res2 = await contract.invokeGetMethod('un_tuple', [res.stack[0]])
    // console.log(res2.stack)
}

main()