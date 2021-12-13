import {Address, Cell, TonClient} from "ton";
import {parseBasicNftMetadataResponse, parseSalesInfoResponse} from "./ton-nft-data";

export class TonNftSellable {
    constructor(private client: TonClient, public address: Address) {

    }


    getBasicInfo = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_nft_basic_info', [])
        let cell = Cell.fromBoc(Buffer.from(res.stack[0][1].bytes, 'base64'))[0]
        return parseBasicNftMetadataResponse(cell)
    }

    getSalesInfo = async () => {
        let res = await this.client.callGetMethod(this.address, 'get_nft_sales_info', [])
        let cell = Cell.fromBoc(Buffer.from(res.stack[0][1].bytes, 'base64'))[0]
        return parseSalesInfoResponse(cell)
    }

    getSupportedInterfaces = async () => {
        let res = await this.client.callGetMethod(this.address, 'supported_interfaces', [])
        return res.stack.map(v => v[1])
    }
}