import {crc16} from "../utils/crc16";
import {CodeBuilder} from "../utils/CodeBuilder";

//
//  Interface declaration is a list of all public GET function names & list of supported messages
//

type InterfaceDeclaration = {
    name: string,
    declaration: string
}

const BasicIntrospectionInterface: InterfaceDeclaration = {
    name: 'BasicIntrospection',
    declaration: '(int...) supported_interfaces()'
}

function getFunctionSelector(declaration: string) {
    return (crc16(declaration) & 0xffff) | 0x10000
}

function getInterfaceId(interfaceDeclaration: string) {
    let lines = interfaceDeclaration.split('\n')
    let interfaceId = 0

    for (let line of lines) {
        interfaceId ^= getFunctionSelector(line)
    }

    return interfaceId
}

function genSupportsInterfaceFunction(interfaces: InterfaceDeclaration[]) {
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

let basicNFTDeclaration =
    'cell get_name()\n' +
    'cell get_symbol()\n' +
    '(int, int) get_creator()\n' +
    '(int, int) get_owner()\n' +
    'cell get_content()'

let basicNFTInterface = {
    name: 'BasicNFT',
    declaration: basicNFTDeclaration
}

let getSequenceInterface = {
    name: 'GetSequenqe',
    declaration: 'int get_seq()'
}

console.log(genSupportsInterfaceFunction([
    basicNFTInterface
]))