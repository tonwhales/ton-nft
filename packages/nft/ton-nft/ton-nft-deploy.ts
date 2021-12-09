import {Address, Cell, ContractSource, TonClient} from "ton";
import {compileFunc} from "ton-compiler";
import {readFile} from "fs/promises";
import {contractAddress} from "ton/dist/contracts/sources/ContractSource";

const stringToCell = (str: string) => {
    let cell = new Cell()
    cell.bits.writeString(str)
    return cell
}

const ownerAndCreator = Address.parseFriendly('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t').address

function buildDataCell(name: string, symbol: string, content: string) {
    let dataCell = new Cell()
    dataCell.bits.writeUint(0, 1)         // inited
    dataCell.refs.push(stringToCell(name))              // name
    dataCell.refs.push(stringToCell(symbol))            // symbol
    dataCell.bits.writeAddress(ownerAndCreator)         // creator
    dataCell.bits.writeAddress(ownerAndCreator)         // owner
    dataCell.refs.push(stringToCell(content))           // content
    dataCell.bits.writeUint(0, 32)      // seq

    return dataCell
}

async function deploy() {
    let funcSource = (await readFile('/Users/altox/Desktop/ton-dev/packages/nft/ERC721/ton-nft.fc')).toString('utf-8')
    let source = await compileFunc(funcSource)
    let sourceCell = Cell.fromBoc(source.cell)[0]
    let dataCell = buildDataCell('First NFT', 'FIRST_NFT', 'https://t.me/narek')

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