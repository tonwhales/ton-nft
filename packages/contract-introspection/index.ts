import {crc16} from "../utils/crc16";
import {CodeBuilder} from "../utils/CodeBuilder";

//
//  Interface declaration is a list of all public GET function names & list of supported messages
//

export type SmartContractInterfaceDeclaration = {
    name: string,
    declaration: string[] // declaration split to lines
}

const BasicIntrospectionInterface: SmartContractInterfaceDeclaration = {
    name: 'BasicIntrospection',
    declaration: ['(int...) supported_interfaces()']
}

function getFunctionSelector(declaration: string) {
    return (crc16(declaration) & 0xffff) | 0x10000
}

function getInterfaceId(interfaceDeclaration: string[]) {
    let interfaceId = 0

    for (let line of interfaceDeclaration) {
        interfaceId ^= getFunctionSelector(line)
    }

    return interfaceId
}

export function genSupportsInterfaceFunction(interfaces: SmartContractInterfaceDeclaration[]) {
    interfaces.push(BasicIntrospectionInterface)

    let code = new CodeBuilder()
    code.add(`(${new Array(interfaces.length).fill('int').join(', ')}) supported_interfaces() method_id {`)
    code.tab()
    for (let i of interfaces) {
        code.add(`;; ${getInterfaceId(i.declaration)}: ${i.name}`)
    }
    let codes = interfaces.map(i => getInterfaceId(i.declaration))
    code.add('return (' + codes.join(', ') + ');')
    code.unTab()
    code.add('}')

    return code.render()
}