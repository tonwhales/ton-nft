import {Address, TonClient} from "ton";
import {bocToCell} from "ton-contract-executor";

export class TonBasicNft {
    constructor(private client: TonClient, public address: Address) {
    }

    getContent = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_content', [])
        let cell = res.stack[0][1].bytes
        return bocToCell(cell).bits.buffer.toString()
    }

    getName = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_name', [])
        let cell = res.stack[0][1].bytes
        return bocToCell(cell).bits.buffer.toString()
    }

    getSymbol = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_symbol', [])
        let cell = res.stack[0][1].bytes
        return bocToCell(cell).bits.buffer.toString()
    }

    getCreator = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_creator', [])
        let [wc, addr] = [res.stack[0][1], res.stack[1][1]]
        return Address.parseRaw(wc.replace('0x', '') + ':' + addr.replace('0x', ''))
    }

    getOwner = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_owner', [])
        let [wc, addr] = [res.stack[0][1], res.stack[1][1]]
        return Address.parseRaw(wc.replace('0x', '') + ':' + addr.replace('0x', ''))
    }

}