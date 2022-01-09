//
//  Generates functions to store & load smc data
//

import {CodeBuilder} from "../utils/CodeBuilder";

type CellRef = { type: 'cell_ref', name: string }
type Uint = { type: 'uint', name: string, size: number }
type Dict = { type: 'dict', name: string }
type Grams = { type: 'grams', name: string }
type Slice = { type: 'slice', name: string }
type MessageAddress = { type: 'message_address', name: string }
type DataCell = { type: 'data_cell', name: string, descriptor: StorageDescriptor }


const cellRef = (name: string) => ({ type: 'cell_ref', name }) as CellRef
const uint = (name: string, size: number) => ({ type: 'uint', name, size }) as Uint
const dict = (name: string) => ({ type: 'dict', name }) as Dict
const grams = (name: string) => ({ type: 'grams', name }) as Grams
const slice = (name: string) => ({ type: 'slice', name }) as Slice
const messageAddress = (name: string) => ({ type: 'message_address', name }) as MessageAddress
const dataCell = (name: string, descriptor: StorageDescriptor) => ({ type: 'data_cell', name, descriptor }) as DataCell

export type DataType =
    | CellRef
    | Uint
    | Dict
    | Grams
    | Slice
    | MessageAddress
    | DataCell

export type StorageDescriptor = DataType[]

export type SmcDescriptor = {
    initField: boolean
    storage: StorageDescriptor
}


function genLoadData(descriptor: SmcDescriptor) {
    let code = new CodeBuilder()

    code.add('_ load_data() impure {')
    code.tab()
    code.add('slice ds = get_data().begin_parse();')
    if (descriptor.initField) {
        code.add('int inited = ds~load_uint(1);    ;; inited')
        code.add('var res = (')
        code.tab()
        for (let field of descriptor.storage) {
            let lastOne = descriptor.storage.indexOf(field) === descriptor.storage.length - 1
            code.add(`ds~${genTypeLoad(field)}${lastOne ? '' : ','}    ;; ${field.name}`)
        }
        code.unTab()
        code.add(');')
        code.add('ds.end_parse();')
        code.add('return res;')
    }
    code.unTab()
    code.add('}')

    return code.render()
}

function genStoreData(descriptor: SmcDescriptor) {
    let code = new CodeBuilder()

    let extractData = `(\n${descriptor.storage.map(field => `        ${getScalarType(field)} ${field.name}`).join(',\n')}\n    ) = ds;`


    code.add('() store_data(var ds) impure {')
    code.tab()
    code.add(extractData)
    code.add()
    code.add('set_data(')
    code.tab()
    code.add('begin_cell()')
    code.tab()
    if (descriptor.initField) {
        code.add('.store_uint(1, 1)')
    }
    for (let field of descriptor.storage) {
        code.add(`.${genTypeStore(field)}`)
    }
    code.add('.end_cell()')
    code.unTab()
    code.unTab()
    code.add(');')
    code.unTab()
    code.add('}')

    return code.render()
}

//
// Creates function to load cell from slice
//
function genLoadCell(descriptor: DataCell) {
    let code = new CodeBuilder()

    code.add(`(slice, _) ~load_${descriptor.name}(slice ds) {`)
    code.tab()
    code.add('var res = (')
    code.tab()
    for (let field of descriptor.descriptor) {
        let lastOne = descriptor.descriptor.indexOf(field) === descriptor.descriptor.length - 1
        code.add(`ds~${genTypeLoad(field)}${lastOne ? '' : ','}    ;; ${field.name}`)
    }
    code.unTab()
    code.add(');')
    code.add('return (ds, res);')
    code.unTab()
    code.add('}')

    return code.render()
}

//
// Creates function to load cell from slice from ref
//
function genLoadCellRef(descriptor: DataCell) {
    let code = new CodeBuilder()

    code.add(`(slice, _) ~load_${descriptor.name}_ref(slice box_ds) inline {`)
    code.tab()
    code.add(`var ${descriptor.name}_cell = box_ds~load_ref();`)
    code.add(`var ds = ${descriptor.name}_cell.begin_parse();`)
    code.add(`var ${descriptor.name}_data = ds~load_${descriptor.name}();`)
    code.add(`ds.end_parse();`)
    code.add(`return (box_ds, ${descriptor.name}_data);`)
    code.unTab()
    code.add('}')

    return code.render()
}

//
//  Creates function to store cell to other cell as ref
//
function genStoreCell(descriptor: DataCell) {
    let code = new CodeBuilder()

    let subFields: string[] = []
    for (let field of descriptor.descriptor) {
        if (field.type === 'data_cell') {
            // Inner cell
            subFields.push(`        var ${field.name}`)
        } else {
            // Scalar
            subFields.push(`        ${getScalarType(field)} ${field.name}`)
        }
    }

    let extractData = `(\n${subFields.join(',\n')}\n    ) = ds;`

    code.add(`builder store_${descriptor.name}(builder _b, var ds) inline {`)
    code.tab()
    code.add(extractData)
    code.add()
    code.add(`return _b.store_ref(build_${descriptor.name}(${descriptor.descriptor.map(field => {
        if (field.type === 'data_cell') {
            return `(${field.name})`
        } else {
            return field.name
        }
    }).join(',')}));`)
    code.unTab()
    code.add('}')

    return code.render()
}

//
// Creates function to build cell
//
function genBuildCell(descriptor: DataCell) {
    let code = new CodeBuilder()

    let subFields: string[] = []
    for (let field of descriptor.descriptor) {
        if (field.type === 'data_cell') {
            // Inner cell
            subFields.push(`        var ${field.name}`)
        } else {
            // Scalar
            subFields.push(`        ${getScalarType(field)} ${field.name}`)
        }
    }

    let extractData = `(\n${subFields.join(',\n')}\n    ) = ds;`


    code.add(`cell build_${descriptor.name}(var ds) {`)
    code.tab()
    code.add(extractData)
    code.add()
    code.add('return begin_cell()')
    code.tab()
    for (let field of descriptor.descriptor) {
        if (field.type === 'data_cell') {
            code.add(`.store_${field.name}(${field.name})`)
        } else {
            code.add(`.${genTypeStore(field)}`)
        }
    }
    code.add('.end_cell();')
    code.unTab()
    code.unTab()
    code.add('}')

    return code.render()
}



function genTypeLoad(type: DataType) {
    if (type.type === 'cell_ref') {
        return 'load_ref()'
    } else if (type.type === 'uint') {
        return `load_uint(${type.size})`
    } else if (type.type === 'dict') {
        return `load_dict()`
    } else if (type.type === 'grams') {
        return 'load_grams()'
    } else if (type.type === 'slice') {
        return 'load_slice()'
    } else if (type.type === 'message_address') {
        return 'load_msg_addr()'
    } else if (type.type === 'data_cell') {
        return `load_${type.name}_ref()`
    }

    throw new Error('Unknown type')
}

function genTypeStore(type: DataType) {
    if (type.type === 'cell_ref') {
        return `store_ref(${type.name})`
    } else if (type.type === 'uint') {
        return `store_uint(${type.name}, ${type.size})`
    } else if (type.type === 'dict') {
        return `store_dict(${type.name})`
    } else if (type.type === 'grams') {
        return `store_grams(${type.name})`
    } else if (type.type === 'slice') {
        return `store_slice(${type.name})`
    } else if (type.type === 'message_address') {
        return `store_slice(${type.name})`
    } else if (type.type === 'data_cell') {
        return `store_ref(${type.name})`
    }

    throw new Error('Unknown type')
}

function getScalarType(type: DataType) {
    if (type.type === 'cell_ref') {
        return `cell`
    } else if (type.type === 'uint') {
        return `int`
    } else if (type.type === 'dict') {
        return `cell`
    } else if (type.type === 'grams') {
        return `int`
    } else if (type.type === 'slice') {
        return `slice`
    } else if (type.type === 'message_address') {
        return `slice`
    } else if (type.type === 'data_cell') {
        return `cell`
    }

    throw new Error('Unknown type')
}

let testContract: SmcDescriptor = {
    initField: true,
    storage: [
        cellRef('metadata_cell'),
        messageAddress('creator'),
        messageAddress('owner'),
        cellRef('content'),
        dataCell('sales_cell', [

        ]),
    ]
}

// console.log(genLoadData(testContract))
// console.log('\n')
// console.log(genStoreData(testContract))
// console.log('\n')

let testCell = dataCell('test', [
    uint('a', 256),
    uint('b', 256),
    uint('c', 256),
    dataCell('inner', [
        uint('x', 256),
        dataCell('very_inner', [
            uint('x', 256),
        ])
    ])
])

let veryInner = dataCell('very_inner', [
    uint('x', 256),
])
console.log(genLoadCell(veryInner))
console.log(genLoadCellRef(veryInner))
console.log(genBuildCell(veryInner))
console.log(genStoreCell(veryInner))

console.log(genLoadCell(testCell.descriptor[3] as DataCell))
console.log(genLoadCellRef(testCell.descriptor[3] as DataCell))
console.log(genBuildCell(testCell.descriptor[3] as DataCell))
console.log(genStoreCell(testCell.descriptor[3] as DataCell))

console.log(genLoadCell(testCell))
console.log(genLoadCellRef(testCell))
console.log(genBuildCell(testCell))
console.log(genStoreCell(testCell))
