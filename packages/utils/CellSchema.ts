type CellInner =
    | CellInnerInt
    | CellInnerUInt
    | CellInnerString

type CellInnerInt = { type: 'int', bitLength: number }
type CellInnerUInt = { type: 'uint', bitLength: number }
type CellInnerString = { type: 'string' }

export class CellSchema {
    private schema: CellInner[] = []

    int(bitLength: number) {
        this.schema.push({ type: 'int', bitLength })
        return this
    }

    uint(bitLength: number) {
        this.schema.push({ type: 'uint', bitLength })
        return this
    }

    string() {
        this.schema.push({ type: 'string' })
        return this
    }

    genCellParserCode() {
        let code = ''

        for (let inner of this.schema) {
            if (inner.type === 'string') {
                code += 'dup sbits 8 / // Fetch slice length in bits and compute length in bytes\n'
                code += '$@\n'
            }
        }

        code += '.s'

        return code
    }

    static stringSchema() {
        return new CellSchema().string()
    }
}