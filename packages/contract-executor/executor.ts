import {Cell} from "ton";
import {crc16} from "../utils/crc16";
import {execAsync} from "../utils/exec";
import {createTempFile} from "../utils/createTempFile";
import { compileFunc } from "ton-compiler";

type TVMConfig = {
    function_selector: number,
    init_stack: TVMStack,
    code: string,
    data: string
}


export type TVMStack = TVMStackEntry[]

type TVMExecutionResult = {
    exit_code: number,
    gas_consumed: number,
    stack: TVMStack,
    data_cell: string           // Base64 serialized BOC
    action_list_cell: string    // Base64 serialized BOC
}

export type TVMStackEntry =
    | TVMStackEntryNull
    | TVMStackEntryCell
    | TVMStackEntryInt
    | TVMStackEntryCellSlice
    | TVMStackEntryTuple

type TVMStackEntryNull = { type: 'null' }
type TVMStackEntryCell = { type: 'cell', value: string }
type TVMStackEntryInt = { type: 'int', value: string }
type TVMStackEntryCellSlice = { type: 'cell_slice', value: string }
type TVMStackEntryTuple = { type: 'tuple', value: TVMStackEntry[] }

async function runTVM(config: TVMConfig): Promise<TVMExecutionResult> {
    let configFile = await createTempFile(JSON.stringify(config))
    let res = await execAsync(`/Users/altox/Desktop/ton/build/crypto/vm-exec -c ${configFile.path}`)
    await configFile.destroy()
    let lines = res.toString().split('\n')
    return JSON.parse(lines[lines.length - 1])
}

export async function runContract(code: string, dataCell: Cell, stack: TVMStack, method: string): Promise<TVMExecutionResult> {
    let tempCodeFile = await createTempFile(code)
    let compiledSource = await compileFunc(code)
    await tempCodeFile.destroy()

    let data = (await dataCell.toBoc({idx: false})).toString('base64')

    let executorConfig = {
        function_selector: getSelectorForMethod(method),
        init_stack: stack,
        code: Buffer.from(compiledSource.fift).toString('base64'),
        data
    }

    return await runTVM(executorConfig)
}

export async function runContractAssebly(code: string, dataCell: Cell, stack: TVMStack, method: string): Promise<TVMExecutionResult> {
    let data = (await dataCell.toBoc({idx: false})).toString('base64')
    let executorConfig = {
        function_selector: getSelectorForMethod(method),
        init_stack: stack,
        code: Buffer.from(code).toString('base64'),
        data
    }

    return await runTVM(executorConfig)
}

function getSelectorForMethod(methodName: string) {
    if (methodName === 'main') {
        return 0
    } else if (methodName === 'recv_internal') {
        return 0
    } else if (methodName === 'recv_external') {
        return -1
    } else {
        return (crc16(methodName) & 0xffff) | 0x10000
    }
}