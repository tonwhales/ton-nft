import {RawMessage, Slice} from "ton";
import {readMessage} from "./messageUtils";

// out_list_empty$_ = OutList 0;
// out_list$_ {n:#} prev:^(OutList n) action:OutAction
//     = OutList (n + 1);
// action_send_msg#0ec3c86d out_msg:^(Message Any) = OutAction;
// action_set_code#ad4de08e new_code:^Cell = OutAction;

export type SendMsgOutAction = { type: 'send_msg', message: RawMessage, mode: number }
export type UnknownOutAction = { type: 'unknown' }

export type OutAction =
    | SendMsgOutAction
    | UnknownOutAction

export function parseActionsList(actions: Slice): OutAction[] {
    let list: any[] = []

    let ref: Slice

    let outAction: OutAction

    try {
        ref = actions.readRef()
    } catch (e) {
        return list
    }

    let magic = actions.readUint(32).toNumber()
    if (magic === 0x0ec3c86d) {
        outAction = {
            type: 'send_msg',
            mode: actions.readUint(8).toNumber(),
            message: readMessage(actions.readRef())
        }
    } else {
        outAction = { type: 'unknown' }
    }

    list.push(outAction)
    list.push(...parseActionsList(ref))
    return list
}