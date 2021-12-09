import {readFile} from "fs/promises";
import {Address, BinaryMessage, Cell, CommonMessageInfo, EmptyMessage, InternalMessage, parseDict, Slice} from "ton";
import {runContract} from "../../contract-executor/executor";
// import {SmartContract} from "../../contract-executor/SmartContract";
import {bocToCell} from "ton-contract-executor";
import {SmartContract} from "../../contract-executor/SmartContract";


const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const cellToBoc = async (cell: Cell) => {
    return (await cell.toBoc({idx: false})).toString('base64')
}

async function sendInternalMessage() {

}

async function main() {
    let source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ERC721/ton-erc721.fc')).toString('utf-8')

    const emptyDict = new Cell()
    emptyDict.bits.writeUint(0, 1)

    let t = Cell.fromBoc(Buffer.from('te6ccgEBBgEATAACA8/YAQICASADBAAj05t7aykDG3tzoytzoQNDK5MsACNXNvbWUgY29udGVudCBoZXJlgCASAFBQAjHNvbWUgY29udGVudCBoZXJlg', 'base64'))[0]
    console.log(777, t)
    let dataCell = new Cell()
    dataCell.bits.writeUint(1, 1)           // inited
    dataCell.refs.push(stringToCell('Test NFT'))       // name
    dataCell.refs.push(stringToCell('TST_NFT'))        // symbol
    dataCell.bits.writeUint(100, 256)       // supply
    dataCell.refs.push(t)
    // dataCell.refs.push(Cell.fromBoc(Buffer.from('te6ccgEBBAEAMwACA8/oAQIAI1c29tZSBjb250ZW50IGhlcmWAIBIAMDACMc29tZSBjb250ZW50IGhlcmWA=', 'base64'))[0])        // content
    // dataCell.refs.push()
    // dataCell.refs.push(emptyDict)        // content
    // dataCell.refs.push(new Cell())    // content

    console.log(dataCell)

    // let ser = await dataCell.toBoc({ idx: false })
    // console.log(ser)
    // console.log(Cell.fromBoc(ser).length)
    // console.log(Cell.fromBoc(ser)[0].refs.length)


    const address = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address
    // const address = new Address(7, Buffer.alloc(256/8))
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
    let msgCell = new Cell()
    msg.writeTo(msgCell)

    console.log(msgCell)

    let res = await runContract(
        source,
        dataCell,
        [
            {type: 'int', value: '100'},
            {type: 'cell', value: await cellToBoc(msgCell) },
            {type: 'cell_slice', value: await cellToBoc(payloadCell) },

            // {type: 'cell', value: await cellToBoc(stringToCell('some content here')) }
            // {type: 'int', value: '3'},
            // { type: 'cell', value: await cellToBoc(emptyDict)}
        ],
        'recv_internal'
    )
    console.log('res', res)

    if (res.stack[0].type === 'cell_slice') {
        let cell = Cell.fromBoc(Buffer.from(res.stack[0].value, 'base64'))
        // console.log(cell[0].bits.buffer.toString())
        console.log(777, cell)
    }
    if (res.stack[0].type === 'cell') {
        let cell = Cell.fromBoc(Buffer.from(res.stack[0].value, 'base64'))
        console.log('cells', cell.length)
        console.log(cell)
        console.log(cell[0].refs[0].bits.buffer.toString('hex'))

        let s = Slice.fromCell(cell[0])
        console.log(s.readOptDict(256, (s) => {
            let offset = (s as any).bits.offset
            let length = (s as any).bits.length
            // console.log(s)
            return s.readBuffer((length - offset)/8).toString()
            // s.readBuffer((s as any).bits.length - (s as any).bits.offset))
        }))
        // console.log(cell.length)
        // console.log(7777, cell)
        // console.log(cell[0].beginParse().readDict(0, s => s))
        // console.log(cell[0].bits.buffer.toString())
        // let dict = parseDict(new Slice(cell[0]), 256, (s) => s)
        // console.log(dict)
    }
}

async function main2() {
    let source = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ERC721/ton-erc721.fc')).toString('utf-8')

    let dataCell = new Cell()
    dataCell.bits.writeUint(1, 1)           // inited
    dataCell.refs.push(stringToCell('Test NFT'))       // name
    dataCell.refs.push(stringToCell('TST_NFT'))        // symbol
    dataCell.bits.writeUint(100, 256)       // supply
    dataCell.bits.writeUint(0, 1)           // content empty dict
    dataCell.bits.writeUint(0, 1)           // owners empty dict

    let contract = await SmartContract.fromFuncSource(source, dataCell, { getMethodsMutate: true })

    let res = await contract.invokeGetMethod('mint', [
        { type: 'int', value: '2' },
        { type: 'int', value: '1' },
        { type: 'int', value: '1' },
    ])
    console.log(res)

    if (res.stack[0].type === 'cell') {
        let cell = Cell.fromBoc(Buffer.from(res.stack[0].value, 'base64'))

        let s = Slice.fromCell(cell[0])
        let d = parseDict(s, 256, (s) => {
            // let offset = (s as any).bits.offset
            // let length = (s as any).bits.length
            // return s.readBuffer((length - offset)/8).toString()

            s.readUint(2)
            s.readUint(1)

            let wc = s.readUint(8)
            let addr = s.readUint(256)

            return [wc, addr]
        })
        console.log(d)
    }

    res = await contract.invokeGetMethod('mint', [
        { type: 'int', value: '3' },
        { type: 'int', value: '1' },
        { type: 'int', value: '2' },
    ])
    console.log(res)

    if (res.stack[0].type === 'cell') {
        let cell = Cell.fromBoc(Buffer.from(res.stack[0].value, 'base64'))

        let s = Slice.fromCell(cell[0])
        let d = parseDict(s, 256, (s) => {
            // let offset = (s as any).bits.offset
            // let length = (s as any).bits.length
            // return s.readBuffer((length - offset)/8).toString()

            s.readUint(2)
            s.readUint(1)

            let wc = s.readUint(8)
            let addr = s.readUint(256)

            return [wc, addr]
        })
        console.log(d)
    }

    res = await contract.invokeGetMethod('owner_of', [
        { type: 'int', value: '3' }
    ])
    if (res.stack[0].type === 'cell_slice') {
        let cell = bocToCell(res.stack[0].value)
        let s = Slice.fromCell(cell)
        s.readUint(2)
        s.readUint(1)

        let wc = s.readUint(8)
        let addr = s.readUint(256)

        console.log([wc, addr])
    }




    // let res = await contract.invokeGetMethod('total_supply', [])
    // console.log(res)
    //
    //
    // const address = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address
    // let payloadBuff = Buffer.alloc(4)
    // payloadBuff.writeUInt32BE(0xFFFFFFFF)
    // let payload = new BinaryMessage(payloadBuff)
    //
    // let payloadCell = new Cell()
    // payload.writeTo(payloadCell)
    // let msg = new InternalMessage({
    //     from: address,
    //     to: address,
    //     value: 100,
    //     bounce: false,
    //     body: new CommonMessageInfo({ body: payload })
    // })
    //
    // let res2 = await contract.sendInternalMessage(msg)
    // console.log(res2)
    //
    //
    // let newCodeCell = new Cell()
    // // newCodeCell.bits.writeUint(0xFFFFFFFF, 32)
    // // newCodeCell.bits.writeUint(0xFFFFFFFF, 32)
    // // newCodeCell.bits.writeUint(0xFFFFFFFF, 32)
    //
    // let res3 = await contract.invokeGetMethod('test3', [
    //     { type: 'cell', value: await cellToBoc(newCodeCell) }
    // ])
    //
    // console.log(res3)
    // // console.log(Cell.fromBoc(Buffer.from(res3, 'base64')))
}

main2()