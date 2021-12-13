import {Address, TonClient} from "ton";
import {bocToCell} from "ton-contract-executor";

export class TonNftSellable {
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

    getIsOnSale = async () => {
        let res = await this.client.callGetMethod(this.address, 'is_on_sell', [])
        let val = parseInt(res.stack[0][1], 16)
        return !!val
    }

    getIsLastBidHistorical = async () => {
        let res = await this.client.callGetMethod(this.address, 'is_last_bid_historical', [])
        let val = parseInt(res.stack[0][1], 16)
        return !!val
    }

    getLastBidValue = async () => {
        let res = await this.client.callGetMethod(this.address, 'last_bid_value', [])
        return parseInt(res.stack[0][1], 16)
    }

    getLastBidder = async () => {
        let res = await this.client.callGetMethod(this.address, 'last_bidder', [])
        let [wc, addr] = [res.stack[0][1], res.stack[1][1]]
        return Address.parseRaw(wc.replace('0x', '') + ':' + addr.replace('0x', ''))
    }

    getFeesPercent = async () => {
        let res = await this.client.callGetMethod(this.address, 'fees_percent', [])
        return parseInt(res.stack[0][1], 16)
    }

    getFeesDestination = async () => {
        let res = await this.client.callGetMethod(this.address, 'fees_destination', [])
        let [wc, addr] = [res.stack[0][1], res.stack[1][1]]
        return Address.parseRaw(wc.replace('0x', '') + ':' + addr.replace('0x', ''))
    }

    getRoyaltiesPercent = async () => {
        let res = await this.client.callGetMethod(this.address, 'royalties_percent', [])
        return parseInt(res.stack[0][1], 16)
    }

    getRoyaltiesDestination = async () => {
        let res = await this.client.callGetMethod(this.address, 'royalties_destination', [])
        let [wc, addr] = [res.stack[0][1], res.stack[1][1]]
        return Address.parseRaw(wc.replace('0x', '') + ':' + addr.replace('0x', ''))
    }

    getSupportedInterfaces = async () => {
        let res = await this.client.callGetMethod(this.address, 'supported_interfaces', [])
        return res.stack.map(v => v[1])
    }
}