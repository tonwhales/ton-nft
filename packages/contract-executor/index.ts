//
//  Compiles FunC smart contract and provides mechanics to invoke methods on it
//

import {join} from "path";
import {tmpdir} from "os";
import {readFileSync, writeFileSync} from "fs";
import {execSync} from "child_process";
import {FiftCell} from "../utils/CellBuilder";
import {crc16} from "../utils/crc16";
import {CodeBuilder} from "../utils/CodeBuilder";
import {CellSchema} from "../utils/CellSchema";

function createTempFile(data: string) {
    let name = (Math.random() * 100000).toString(16)
    let path = join(tmpdir(), name)

    writeFileSync(path, data, { encoding: 'utf-8' })

    return path
}

function compileFunc(files: string[]) {
    let res = execSync(`./func/func -PS ./func/stdlib.fc ${files.join(' ')}`)
    return res.toString()
}

function executeFift(file: string) {
    let res = execSync(`./fift/fift -I ./fift ./fift/Asm.fif ${file}`)
    return res.toString()
}

function compileSmartContract(src: string) {
    let tempCodeFile = createTempFile(src)
    let fiftCode = compileFunc([tempCodeFile])

    return new SmartContract(fiftCode)
}

type ContractContext = {
    code: string
    data: FiftCell
    invokeMethodName: string,
    invokeArgs: string[],
    responseSchema: CellSchema
}

function genFiftContractRunner(ctx: ContractContext) {
    let methodSelector

    if (ctx.invokeMethodName === 'main') {
        methodSelector = 0
    } else if (ctx.invokeMethodName === 'recv_internal') {
        methodSelector = 0
    } else if (ctx.invokeMethodName === 'recv_external') {
        methodSelector = -1
    } else {
        methodSelector = (crc16(ctx.invokeMethodName) & 0xffff) | 0x10000
    }

    let code = new CodeBuilder()

    code.add('"Asm.fif" include')
    code.add()
    code.add('// Simple SmartContractInfo structure emulation')
    code.add('{ | | 0x076ef1ea , 0 , 0 , now , 0 , now , now , 100 0 pair , , } : BuildSmartContractInfo')
    code.add()
    code.add(ctx.code)
    code.add()
    code.add('<s constant Code')
    code.add()
    for (let arg of ctx.invokeArgs) {
        code.add(arg)
    }
    code.add('' + methodSelector)
    code.add('Code')
    code.add(ctx.data.build())
    code.add('BuildSmartContractInfo')
    code.add('runvmctx')
    code.add()
    code.add('drop    // drop new Data')
    code.add('drop    // drop return code')
    // code.add('<s .s') // Print out stack
    code.add()
    code.add(ctx.responseSchema.genCellParserCode())

    return code.render()
}

class SmartContract {
    private code: string
    private currentData = new FiftCell()

    constructor(code: string) {
        this.code = code
    }

    setCurrentData(data: FiftCell) {
        this.currentData = data
    }

    invokeGetMethod(methodName: string, args: string[], responseSchema: CellSchema) {
        let code = genFiftContractRunner({
            code: this.code,
            data: this.currentData,
            invokeMethodName: methodName,
            invokeArgs: args,
            responseSchema
        })
        let out = executeFift(createTempFile(code))
        let outLines = out.split('\n')
        outLines = outLines.slice(0, outLines.length - 1)

        return outLines
    }
}

let source = readFileSync('./ton-public-nft.fc', 'utf-8')
let contract = compileSmartContract(source)

let initialData = FiftCell.create()
    .storeUint(1, '1')
    .storeCell(FiftCell.stringCell('Test Token'))
    .storeCell(FiftCell.stringCell('TSTKN'))
    .storeCell(FiftCell.stringCell('Some url'))

contract.setCurrentData(initialData)

let res = contract.invokeGetMethod('get_name', [], CellSchema.stringSchema())
console.log(res)


