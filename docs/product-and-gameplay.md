# Product and gameplay

**Status:** Draft for contributor and owner review

## First release

A friend enters a display name and creates a room. They share a short room code or invite link. Guests join the lobby, see who is present, and wait for the host to start. The proposed range is two to six players, based on the current prototype.

During the match, players see their own hand, the table state, whose turn it is, and how many cards each opponent holds. The game guides them through playing, drawing, and resolving any card choices. A match ends with a clear winner or draw result. Players can return to the same lobby for a rematch or leave the room.

The first release assumes guest sessions and invite-only rooms. The lobby and match should work on phones and desktops. Each suit needs a distinct symbol and text label so players can identify it without relying on color.

## Gameplay direction

Use the existing prototype to learn which interactions feel good, including playing cards, escalating pressure, changing turn order, and handing a choice to another player. Give the new game its own card set, balance, rule text, and visual identity. The basic loop is to match the top card by suit or symbol, resolve its effect, and try to empty your hand.

One candidate signature card is **Pounce**. Playing it lets you pick an opponent. They choose to draw two cards or give you one of their cards at random. The table sees the choice and its outcome, while the identity of a transferred card stays within the two players' private views. Playtest the effect and decide whether it can end a match before adding it to the deck.

Before implementing the engine, agree on a rules table with deck composition, starting hand, legal plays, draw behavior, action effects, and victory conditions. Write example turns for two players and for larger tables. Resolve what happens when the deck runs out, an effect changes multiple hands, a player cannot act, or more than one player meets a win condition. State when each effect ends and when the turn advances.

## Meow theme

Use the owner's Indian-English reading of “meow” as the tone reference. Keep it in a few places where it feels natural, such as a welcome line like **“Meow! Pull up a chair.”**, an optional short meow when a match starts, and an original cat mark on card backs. Keep controls such as **Create room**, **Join room**, and **Draw card** direct. Ask the owner for a preferred spelling or sample recording before producing voice assets.

### Visual baseline

Keep the centered green felt table, visible draw and discard piles, and the player's hand below. Use the current near-black green canvas, cream text, and gold accents for the primary action, room code, and active turn.

| Role | Colors from the prototype |
| --- | --- |
| Canvas and felt | `#0E1A14`, `#2D7048`, `#16402A` |
| Primary and muted text | `#EEF3EF`, `#9DB0A4` |
| Primary action and active seat | `#FFD23F` |
| Secondary controls | `#33473B` |
| Card suits | Red `#D72600`, yellow `#D99A00`, green `#2A9D48`, blue `#0B6FD1` |

Consolidate these colors into CSS variables as the interface is built. Use original card faces and backs with legible suit symbols. Improve hierarchy with spacing and consistent controls, and use motion briefly to show a card move or a turn change. Check focus, contrast, and hand overflow on a narrow phone screen and with a large hand.

Use text and consistent icons for buttons, card actions, alerts, activity messages, and empty states. Keep emoji out of product-authored UI. Use text such as “Bot” and “Sound off” when the label is clearer. Give icon-only controls accessible names. Keep the Meow identity in the name, original cat mark, and optional sound.

## Decisions for the owner

| Decision | Proposed starting point |
| --- | --- |
| Hosting and persistence | Use one WebSocket-capable service for a friends-only pilot. Rooms ride through a player's refresh or network drop while the service is running. Add durable storage if matches must survive a service restart or deployment. |
| First-release game modes | Ship complete online rooms first. Schedule bots and same-device play as follow-ups unless either is required for launch. |
| Disconnected players | Give players a short grace period to reclaim the same seat in the same tab. In the lobby, transfer host controls if needed. During a match, resolve an expired seat and any pending choice according to the approved rules. |
| Gameplay and voice | Approve the original card set and signature mechanic. Confirm how prominent the Meow theme should be and provide a pronunciation reference if the game will use spoken audio. |

Hosting access is needed for the first public lobby test. The original ruleset needs to be approved before implementing card effects. Workspace setup and the basic lobby can proceed independently from card balance. Include default actions for a disconnected or idle player, pending-choice expiry, and a match with no playable continuation in the rules reference before the full-match milestone.

Matchmaking, accounts, rankings, chat, and permanent history are candidates for a later release. Short-lived reconnect sessions are part of the online room experience.
