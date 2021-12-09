import {Address, Cell, ContractSource, TonClient} from "ton";
import {compileFunc} from "ton-compiler";
import {readFile} from "fs/promises";
import {contractAddress} from "ton/dist/contracts/sources/ContractSource";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

function buildDataCell() {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)        // inited

    return dataCell
}

async function deploy() {
    let funcSource = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/test/ping-pong.fc')).toString('utf-8')
    let source = await compileFunc(funcSource)
    let sourceCell = Cell.fromBoc(source.cell)[0]
    let dataCell = buildDataCell()

    let contractSource: ContractSource = {
        initialCode: sourceCell,
        initialData: dataCell,
        workchain: 0,
        type: '',
        backup: () => '',
        describe: () => 'nft'
    }

    let address = await contractAddress(contractSource)

    console.log('contrct address', address)

    let client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
    })

    let msgCell = new Cell()
    msgCell.bits.writeUint(0, 1)

    await client.sendExternalMessage(
        {
            address,
            source: contractSource
        },
        msgCell
    )

    console.log('Init message was sent to', address)
}

deploy()