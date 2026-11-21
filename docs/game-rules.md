# Meow Table Game Rules

**Status:** The numbered-card loop and six action effects are implemented for local playtesting.

**Version:** 0.3.0

**Target:** Phase 3 (3A minimal playable loop, followed by 3B full action card effects)

---

## 1. Vision and Tone Reference

Meow Table is a warm, casual card-shedding game for two to six friends gathered in a private room.

- **Tone and Voice:** Lighthearted, friendly, and grounded in the owner's Indian-English reading of "meow" (e.g., *"Meow! Pull up a chair."*). Controls remain clear, direct, and emoji-free (e.g., **Create room**, **Draw card**, **Play card**, **Rematch**).
- **Visual Palette:** Centered green felt table (`#2D7048`, `#16402A`) on a deep canvas (`#0E1A14`), cream text (`#EEF3EF`, muted `#9DB0A4`), gold accents for active seats and primary actions (`#FFD23F`), and distinct suit tones.
- **Accessibility:** Color is never the sole indicator of suit. Every card displays both its suit name and a distinct geometric symbol alongside rank/action indicators.

---

## 2. Deck and Setup

### 2.1 Suits and Identity

The game uses four distinct suits:

| Suit Name | Text Label | Icon Symbol | Tone / Prototype Color |
| :--- | :--- | :--- | :--- |
| **Paws** | `PAW` | Stylized Paw Print icon | Red (`#D72600`) |
| **Bells** | `BELL` | Alert Bell icon | Yellow (`#D99A00`) |
| **Catnip** | `NIP` | Catnip Leaf icon | Green (`#2A9D48`) |
| **Fish** | `FISH` | Fish icon | Blue (`#0B6FD1`) |

Wild cards carry a multi-suit border or neutral dark badge with the **Curious Cat** mark.

---

### 2.2 Card Distribution and Quantities

The complete Meow Table deck contains **112 cards**:

1. **Numbered Cards (76 cards total):**
   - Rank `0`: 1 card per suit (4 cards total)
   - Ranks `1` through `9`: 2 cards per rank per suit (2 × 9 × 4 = 72 cards total)
2. **Suit Action Cards (24 cards total — Phase 3B):**
   - **Hiss** (Skip): 2 cards per suit (8 cards total)
   - **Tail Spin** (Reverse): 2 cards per suit (8 cards total)
   - **Double Treat** (Draw Two): 2 cards per suit (8 cards total)
3. **Wild Cards (12 cards total — Phase 3B):**
   - **Curious Cat** (Wild): 4 cards (choose next active suit)
   - **Catnap** (Wild Draw Four): 4 cards (choose suit; next player draws 4 and skips turn)
   - **Pounce** (Signature Card): 4 cards (target draws 2 or gives 1 random card to actor)

Deal seven cards per player and set aside one opening discard. The remaining cards form the draw pile.

| Players | Cards dealt | Phase 3A draw pile | Phase 3B draw pile |
| --- | ---: | ---: | ---: |
| 2 | 14 | 61 | 97 |
| 3 | 21 | 54 | 90 |
| 4 | 28 | 47 | 83 |
| 5 | 35 | 40 | 76 |
| 6 | 42 | 33 | 69 |

---

### 2.3 Staged Implementation (Phase 3A vs Phase 3B)

To ensure high reliability, clean architecture, and independent verification by Codex:

- **Phase 3A (Minimal First Playable Slice):**
  - Uses the **76 numbered cards** (`0`–`9` across `PAW`, `BELL`, `NIP`, `FISH`).
  - Implements the complete authoritative server match loop: deal, legal play validation, draw, discard pile recycling, turn progression, win detection, and rematch.
  - No pending choices or complex multi-target actions; validates rock-solid server authority, ordering, deduplication, and private hand views.
- **Phase 3B (Full Effect Set):**
  - Introduces Hiss, Tail Spin, Double Treat, Curious Cat, Catnap, and Pounce.
  - Introduces pending choice timers and multi-seat transfers.

---

### 2.4 Setup and Opening Procedure

1. **Start Trigger:** The room host selects **Start match** with two to six seats made up of connected players and any bots. Each room needs at least one human. The room locks to new joins and those seats form the match roster. A participating player who disconnects can reclaim their existing seat during the grace period.
2. **Shuffle and Deal:** The server shuffles the deck and deals 7 private cards to each participant. Tests use a fixed deck or controlled randomness.
3. **Opening Discard:** The top card of the draw pile is flipped face-up into the discard pile.
   - *Phase 3A:* The card is always a numbered card.
   - *Phase 3B:* Take the first numbered card from the shuffled remainder as the opening discard, keeping all other cards in their existing order. The supported deck and seat counts guarantee a numbered opening card.
4. **Opening Seat and Direction:** The room host opens the game (Seat 0). Play proceeds **clockwise** (increasing seat index in lobby order).

The host can add or remove bots in the lobby. Bots occupy ordinary game seats with private hands. After a brief pause, a bot usually plays from its strongest suit and saves wild cards. When the next opponent has two cards or fewer, it favors an available skip, penalty, or reversal that steers the turn away from that opponent. Pounce targets the opponent with the fewest cards, breaking ties in turn order. A blocked bot normally draws once, but will choose Deep Draw if it has four cards or fewer and the next opponent has two or fewer. The bot plays a drawn match. It sees its own hand and public hand counts, and the server validates bot and human moves through the same rules.

---

## 3. One Normal Turn

On their turn, the active player must take exactly one of the following two paths:

### Path A: Play a Legal Card

A card in hand is legal to play if:
1. Its **suit** matches the active suit (e.g., `PAW 5` onto `PAW 8`), OR
2. Its **rank or suited action** matches the top discard (e.g., `NIP 5` onto `PAW 5`), OR
3. It is a valid **Wild** card (Phase 3B).

When played:
- The card moves from the player's private hand to the top of the discard pile.
- A suited card sets the active suit. A Wild resolves the active suit as specified in Section 5.
- Resolve the card effect, check for a shedding win, then advance the turn if the match is still running.

### Path B: Draw from the Pile

- **Draw:** Take one card, even if you have a legal play.
- **Deep Draw:** If your hand has no legal play and at least two cards are available, search up to three cards deep. Stop at the first playable card or when the available cards run out. Every card drawn stays in your hand unless you play it.
- **After drawing:** Play the matching card or pass and keep it. The play window uses the original turn deadline. If no match was drawn, the turn advances. The table shows how many cards were drawn.

### Draw Pile Exhaustion and Recycling

- If the draw pile empties and a player needs to draw:
  1. The top card of the discard pile remains in place as the active discard.
  2. All cards beneath the top discard card are collected, shuffled on the server, and form the new draw pile.
  3. The player completes their draw from the newly recycled pile.
- **Exhaustion:** When there are no drawable cards, an active player with a legal card must play. If only another eligible seat can play, advance to the next eligible seat in turn order. If nobody can play, end with a stalemate draw. A penalty draw takes up to the required number, recycles when needed, and resolves even if the deck runs out.

---

## 4. End of Match and Rematch

### 4.1 Victory Conditions

1. **Shedding Win:** The first player to play their last card (hand count drops to `0`) wins the match immediately upon that card's resolution.
2. **Forfeit Win:** If only one non-forfeited seat remains, that player wins. A seat within its reconnect grace period still counts. If a single expiry pass removes every remaining seat, close the abandoned match without a winner.
3. **Stalemate Draw:** If no legal moves or draws remain across the entire table, the match concludes as a Draw.

### 4.2 Post-Match State and Rematch

1. When a match concludes, the server broadcasts a `finished` match view showing:
   - Final status: winner seat ID or draw.
   - Final hand sizes of all players. For a forfeited seat, display its hand size at forfeit.
2. **Rematch Eligibility:**
   - The current host can select **Rematch** with at least two seats, counting connected people and bots. Apply the room's existing host succession when the host forfeits.
   - The rematch includes connected non-forfeited players and the same bots. Seats omitted from the rematch have no claim to its hands or turns.
3. **Reset Behavior:**
   - A fresh deck is created and shuffled.
   - 7 cards are dealt to each participant.
   - Opening discard is turned.
   - The opening seat rotates clockwise from the previous opening seat in the room's seat order, including bots. The new match starts clockwise.
   - The room revision increments and match status returns to `playing`.
4. **Back to lobby:** From a finished match, the host can reopen the same room code, change the bots, and invite more players before starting a new match. Previous match actions expire when the table reopens.

---

## 5. Action Effects and Choices (Phase 3B)

| Card | Eligible Actor | Target | Resolution | Information Boundary | Advance Point |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hiss (Skip)** | Active player | Next player in order | Target loses their turn. At two seats, the actor takes another turn. | The played card and next seat are public. | Immediately upon play. |
| **Tail Spin (Reverse)** | Active player | Entire table | Reverse direction. At two seats, the actor takes another turn. | The direction and next seat are public. | Immediately upon play. |
| **Double Treat (Draw Two)** | Active player | Next player in order | Target draws up to 2 cards and loses their turn. | Counts are public. Drawn cards only appear in the recipient's hand. | After the draw resolves. |
| **Curious Cat (Wild)** | Active player | Active player | Submit the card with the new active suit. | The active suit appears on the table. | Immediately upon submission. |
| **Catnap (Wild Draw Four)** | Active player | Next player in order | Submit the card with the new active suit. Target draws up to 4 cards and loses their turn. | Suit and counts are public. Drawn cards only appear in the recipient's hand. | After the draw resolves. |
| **Pounce (Signature Card)** | Active player | Chosen non-forfeited opponent | Target draws up to 2 cards or gives 1 random card to the actor. Giving a card requires at least 2 cards in the target's hand. Keep the current active suit. | Everyone sees seat names and hand counts. Only the actor and target see the transferred card. | Resolve the response, then advance from the actor in the current direction if the match continues. The target keeps their turn in the normal order. |

The turn-order label below the piles shows the server's current direction. Tail Spin flips its arrow and reverses the order of future turns. For example, with A, B, C, and D seated clockwise, A playing Tail Spin sends the turn to D. With only two seats left, A plays again. A new match starts clockwise, including a rematch.

Action faces use short effect labels such as **Skip** and **Reverse**. Draw penalties put **+2** or **+4** in the center. The table explains the top action card beside the discard.

The **Card guide** compares Meow Table cards with their closest counterparts in the reference game. **Read rules** and the guide’s **Rules PDF** button open the publisher’s PDF in a new tab. Meow Table matches follow the rules on this page. [Rules PDF](https://service.mattel.com/instruction_sheets/HVW18-Eng.pdf)

### Special Resolution: Pounce as Final Card
- If a player plays **Pounce** as their last card:
  - If the target picks **Option A (Draw 2)**: The actor has 0 cards and immediately **WINS**.
  - If the target picks **Option B (Give 1 card)**: The actor receives a card and now holds 1 card, so the match **continues**!
  - *Design intent:* Adds an exciting layer of bluffing, tactical choice, and suspense.

---

## 6. Two-Player and Larger Table Examples

### Example 1: Two-Player Match (Alice vs Bob)
- Initial state: Discard is `PAW 3`. Direction: Clockwise.
- Alice plays `BELL 3` (rank match). Discard is now `BELL 3`. Alice hand: 6 cards.
- Bob plays `BELL 7` (suit match). Discard is now `BELL 7`. Bob hand: 6 cards.
- Alice has no `BELL` or `7`. Alice draws 1 card (`NIP 7`). Since `NIP 7` matches the discard's rank (`7`), Alice immediately plays `NIP 7`. Alice hand: 6 cards. Discard is `NIP 7`.
- Bob plays `FISH 7`. Hand: 5 cards. Play continues.

### Example 2: Four-Player Table with Pile Recycling (Alice, Bob, Carol, Dave)
- Clockwise order: Alice → Bob → Carol → Dave.
- Draw pile has 1 card remaining. Discard pile has 32 accumulated cards beneath `FISH 4`.
- Alice has no legal play. Alice draws the last remaining card, `BELL 7`. It cannot be played on `FISH 4`, so Bob's turn begins.
- Bob takes his turn. Bob has no legal card and must draw.
- Server detects empty draw pile:
  - Preserves `FISH 4` as the active discard.
  - Shuffles the remaining 32 cards to create a new draw pile.
  - Bob draws `PAW 2` from the recycled draw pile (31 cards remain).
  - The draw cannot be played. Turn advances to Carol.

### Example 3: Pending Choice Resolution (Alice plays Pounce on Carol)
- Seated players: Alice, Bob, Carol, Dave.
- Alice plays `Pounce` and selects Carol as the target.
- The server starts a 15-second response window for Carol, who holds at least two cards. The play still belongs to Alice.
- Table UI shows: *"Alice pounced on Carol! Carol is deciding..."*
- Carol's screen prompts: `[Draw 2 Cards]` or `[Give 1 Random Card]`.
- Carol selects `[Give 1 Random Card]`.
- The server selects 1 card at random from Carol's hand (`NIP 2`) and transfers it to Alice.
- Carol's hand count decreases by 1; Alice's hand count increases by 1.
- Event broadcast: Public log states `"Carol gave a card to Alice."`
- Private update: Alice sees `NIP 2` added to her hand. Carol sees `NIP 2` removed from her hand. Bob and Dave see only the count changes.
- Turn advances to Bob (next seat after Alice).

---

## 7. Timing, Reconnect, and Disconnect Policy

### 7.1 Turn and Choice Deadlines

| Timer | Duration | Expiry Default Action |
| :--- | :--- | :--- |
| **Normal Turn** | 30 seconds | Close an open drawn-card window by passing. Otherwise draw once and keep the card. If drawing is impossible and the active seat can play, play its first legal card in hand order. An automatic Pounce targets the next eligible opponent in the current direction. |
| **Suit or target selection** | Within the normal turn | The selected card stays in the player's hand until they submit a valid choice. When the engine must choose a suit for an automatic play, it picks the most common in hand, with ties in deck suit order. |
| **Pounce Response** | 15 seconds | A human timeout draws up to 2. A bot uses its short turn pause and gives a card when it can prevent an immediate loss. |

### 7.2 Reconnect and Disconnect Lifecycle

- **Match Grace Period:** 60 seconds (matches the lobby reconnect grace period).
- **Transient Disconnect:**
  - If a player loses connection during their turn or during a pending choice, the room holds their seat for 60 seconds.
  - When the player re-establishes their socket with their private session token, the server returns the current match view, their private hand, and any pending choice prompt with remaining time.
  - The browser tries to reconnect automatically after a brief interruption. A resumed seat moves to the latest authorized connection. The previous tab stops retrying for that seat.
  - Turn and choice deadlines keep running during a disconnect. The server resolves expired deadlines before sending the resumed view.
- **Seat Expiry / Forfeit:**
  - If a player's grace period expires, or if they choose **Leave room** and **Confirm leave**:
    - The seat is marked forfeited and their connection is severed.
    - Record the forfeited hand size and shuffle the remaining cards into the draw pile without exposing card identities.
    - Apply the forfeit result in Section 4 before advancing. With two or more seats remaining, advance past a forfeited active seat in the current direction.
    - If the Pounce actor forfeits, cancel the response and advance from that seat. If the Pounce target forfeits, resolve the effect without drawing or transferring a card, then check the actor's hand for a shedding win.

---

## 8. Deterministic Test Cases (Specification for Engine Verification)

These scenarios specify expected behaviors for the server match engine in `backend/src/game.ts`:

1. **`test_deal_setup`**:
   - Given 2 players (Seats S1, S2) and a deterministic 76-card deck:
   - S1 and S2 receive exactly 7 cards each.
   - Discard pile has exactly 1 face-up numbered card.
   - Draw pile has 61 cards remaining.
   - Active seat is S1 (Host).
2. **`test_legal_suit_play`**:
   - Discard: `PAW 3`. Active seat S1 holds `[PAW 8, NIP 2]`.
   - S1 plays `PAW 8`.
   - Action succeeds: Discard becomes `PAW 8`, S1 holds `[NIP 2]`, active seat advances to S2.
3. **`test_legal_rank_play`**:
   - Discard: `PAW 3`. Active seat S1 holds `[BELL 3, NIP 2]`.
   - S1 plays `BELL 3`.
   - Action succeeds: Discard becomes `BELL 3`, active seat advances to S2.
4. **`test_illegal_play_rejected`**:
   - Discard: `PAW 3`. Active seat S1 holds `[BELL 5, NIP 2]`.
   - S1 attempts to play `BELL 5`.
   - Action is rejected. State and revision remain untouched.
5. **`test_off_turn_play_rejected`**:
   - Active seat is S1. S2 attempts to play a matching card.
   - Action is rejected. State remains untouched.
6. **`test_unplayable_draw_advances`**:
   - Draw pile top card: `FISH 9`. Discard: `PAW 3`. S1 holds `[BELL 5]`.
   - S1 executes `draw`.
   - S1 keeps `FISH 9`. Turn advances to S2 without opening a choice window.
7. **`test_drawn_card_immediate_play`**:
   - Draw pile top card: `PAW 9`. Discard: `PAW 3`. S1 holds `[BELL 5]`.
   - S1 executes `draw`.
   - S1 immediately plays `PAW 9`. Discard becomes `PAW 9`. S1 hand remains `[BELL 5]`. Turn advances to S2.
8. **`test_discard_pile_recycling`**:
   - Draw pile is empty. Discard pile has `PAW 5` on top and nine cards beneath it. Fix the reshuffle so `FISH 9` is drawn first.
   - S1 executes `draw`.
   - Draw pile has eight cards left. Discard retains only `PAW 5`. S1 keeps `FISH 9` and the turn advances to S2.
9. **`test_win_on_empty_hand`**:
   - S1 holds 1 card: `PAW 4`. Discard: `PAW 1`.
   - S1 plays `PAW 4`.
   - S1 hand reaches 0 cards. Match status becomes `finished`, winner is S1. No further turn advance occurs.
10. **`test_rematch_reset`**:
    - Match is `finished`. Host triggers `rematch`.
    - Both S1 and S2 receive new 7-card hands.
    - Discard has 1 new card. Match status returns to `playing`. Active seat rotates to S2.
11. **`test_pass_on_playable_draw`**:
    - S1 draws `PAW 9` onto `PAW 3`. S1 also holds `PAW 4` from before the draw.
    - S1 cannot play `PAW 4` during the draw window. Passing keeps both cards and advances to S2.
12. **`test_exhausted_pile`**:
    - Draw pile is empty. Discard pile contains only `PAW 3`. S1 holds `BELL 5`.
    - If S2 holds `NIP 3`, S2 becomes active. If S2 instead holds `NIP 2` and no other seat can play, the match ends in a draw.

---

## 9. Rules Decisions and Playtest Topics

The local deck uses single draws and the optional Deep Draw, timed turns and responses, and host-started rematches. Playtesting can tune the deck and timing.

- Check turn length and draw frequency at two and six seats.
- See how often Pounce delays a last-card win and how clear its target prompt feels.
- Double Treat and Catnap resolve immediately. Draw stacking is a future house-rule decision.
