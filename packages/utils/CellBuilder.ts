//
//  Generates Fift Code to build a cell
//

export class FiftCell {
    private code = '<b '

    storeInt(bitLength: number, binValue: string) {
        this.code += `${bitLength} ${binValue} i, `
        return this
    }

    storeUint(bitLength: number, binValue: string) {
        this.code += `${bitLength} ${binValue} u, `
        return this
    }

    storeString(str: string) {
        this.code += `"${str}" $, `
        return this
    }

    storeCell(cell: FiftCell) {
        this.code += `${cell.build()} ref, `
        return this
    }

    build() {
        return this.code + ' b>'
    }

    static create() {
        return new FiftCell()
    }

    static stringCell(str: string) {
        return new FiftCell().storeString(str)
    }
}

// let builder = new FiftCell()
//
// let code = builder
//     .storeUint(1, '1')
//     .storeCell(FiftCell.stringCell('Test Token'))
//     .storeCell(FiftCell.stringCell('TSTKN'))
//     .storeCell(FiftCell.stringCell('Some url'))
//     .build()
//
// console.log(code)

