import {Cell, ContractSource, TonClient} from "ton";
import {compileFunc} from "ton-compiler";
import {readFile} from "fs/promises";
import {contractAddress} from "ton/dist/contracts/sources/ContractSource";

function buildDataCell() {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)        // inited

    return dataCell
}

async function deploy() {
    let funcSource = (await readFile('./packages/nft/ping-pong/ping-pong.fc')).toString('utf-8')
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
        endpoint: 'https://test.tonwhales.com/api/jsonRPC'
    })

    let msgCell = new Cell()
    msgCell.bits.writeUint(0, 1)

    try {
        await client.sendExternalMessage(
            {
                address,
                source: contractSource
            },
            msgCell
        )
    } catch (e) {
        console.log(e)
    }


    console.log('Init message was sent to', address)
}

deploy()