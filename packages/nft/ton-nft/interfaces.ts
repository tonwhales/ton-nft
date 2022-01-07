import {genSupportsInterfaceFunction, SmartContractInterfaceDeclaration} from "../../contract-introspection";

// gift_to 9d84cf96
// place_bid 5cb63e53
// enable_selling 2ed7c261
// disable_selling 3f4bb568
// accept_last_bid 569921e8

// Response codes:
//
// 0xffffffff - operation not supported

export const BasicNftInterface: SmartContractInterfaceDeclaration = {
    name: 'Basic NFT interface',
    declaration: [
        'cell get_nft_basic_info()',
        'int-msg: gift_to#9d84cf96 query_id: uint32, address: MsgAddress'
    ]
}

export const BasicNftCommentInterface: SmartContractInterfaceDeclaration = {
    name: 'Basic NFT interface with comment messages',
    declaration: [
        'int-msg-comment: giftTo:$RAW_ADDRESS$',
    ]
}

export const SellableNftInterface: SmartContractInterfaceDeclaration = {
    name: 'Sellable NFT interface',
    declaration: [
        'cell get_nft_sales_info()',
        'int-msg: place_bid#5cb63e53 query_id: uint32',
        'int-msg: enable_selling#2ed7c261 query_id: uint32',
        'int-msg: disable_selling#3f4bb568 query_id: uint32',
        'int-msg: accept_last_bid#569921e8 query_id: uint32',
    ]
}

export const SellableNftCommentInterface: SmartContractInterfaceDeclaration = {
    name: 'Sellable NFT interface with comment messages',
    declaration: [
        'int-msg-comment: pbid',
        'int-msg-comment: sel+',
        'int-msg-comment: sel-',
        'int-msg-comment: acpt'
    ]
}

export const SellableNftInterfaces = [
    BasicNftInterface,
    BasicNftCommentInterface,
    SellableNftInterface,
    SellableNftCommentInterface
]

// console.log(genSupportsInterfaceFunction(SellableNftInterfaces))