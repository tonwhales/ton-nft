# Ton NFT white paper

## Basic concepts

TON NFT is quite similar to ERC-721, but it have some differences described below:

- single contract is a single NFT (in future unique collection id's will be used to distinguish NFT's from single collection)
- this means there is no supply or balance and single NFT contract has only single owner
- NFT handles sales and bids by itself, this means there is no need for approvals and separate marketplace contract

## NFT Sale process

There is two ways to transfer NFT:


Each NFT can be directly gifted by owner to some other address.


Owner can set NFT as "salable" which means that any other user can place a bid on that NFT.
When placing a bid person should send bid value + fees in a message.
NFT holds that bid value until NFT owner accepts bid (in that case NFT is transferred to new owner and bid value is transferred to the previous owner).
When new bid (with higher value than previous one) is placed then value of previous bid is returned to the bid-maker.


## GET methods

```cell get_nft_basic_info()```

Returns basic nft information in format:


Metadata Cell

- uint10 name_len
- name_len * bit name
- uint10 symbol_len
- symbol_len * bit symbol


Result Cell

- metadata_cell metadata
- addr_std$10 creator
- addr_std$10 owner
- cell content

```cell get_nft_sales_info()```

Returns nft sales information in format:

Metadata Cell

- uint1 is_on_sale
- uint1 is_last_bid_historical
- grams last_bid_value
- addr_std$10 last_bidder
- uint8 fees_percent
- addr_std$10 fees_destination
- uint8 royalties_percent
- addr_std$10 royalties_destination


## Internal messages

Gifting NFT:

To gift NFT owner should send internal message to NFT with comment in format:

```giftTo:$RAW_ADDRESS_OF_NEW_OWNER$```

For example:


```giftTo:0:f814fabe3d10e27b240a922cc54d1b520f2b9c508aab8f4bffcd7266a9a0e9eb```