import {execSync} from "child_process";
import {writeFileSync} from "fs";
import {tmpdir} from 'os'
import {join} from 'path'

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

let sourceFile = process.argv[process.argv.length - 1]

let fiftSource = compileFunc([sourceFile])


console.log(fiftSource)

fiftSource =
    `"Asm.fif" include` +
    `\n` +
    `${fiftSource}\n` +
    `<s \n` + // transform Cell to Slice
    `runvmdict \n` + // run TVM
    `.s` // print out stack
    // `dup boc>B "sample.boc" B>file`

let fiftFile = createTempFile(fiftSource)
let out = executeFift(fiftFile)
console.log(out)