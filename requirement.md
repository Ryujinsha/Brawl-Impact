# Platform Brawl — Game Requirements

## 1. Project Overview

**Brawl Impact** adalah game 2D platform fighter multiplayer berbasis web.

Pemain bertarung di arena platform dan berusaha mengeliminasi pemain lain dengan serangan, damage, dan knockback.

### Genre

* 2D Platform Fighter
* Multiplayer
* Competitive
* Real-time

### Target Platform

Desktop Web Browser.

### Player Count

2–4 pemain per room.

---

# 2. Technology Requirements

## Frontend

* React
* TypeScript
* Vite
* HTML5 Canvas atau Phaser 3

## Backend

* Node.js
* TypeScript
* Socket.IO

## Styling

* CSS atau Tailwind CSS

## Package Manager

* npm

---

# 3. Core Gameplay Requirements

The game must support:

* Player movement
* Jumping
* Gravity
* Platform collision
* Attacking
* Damage
* Knockback
* Player elimination
* Winner detection
* Multiplayer synchronization

A player loses when they fall outside the arena.

The last remaining player wins the match.

---

# 4. Character Requirements

The MVP must contain four playable characters.

| Character | Role         | Main Gameplay           |
| --------- | ------------ | ----------------------- |
| Knight    | Balanced     | Melee combat            |
| Mage      | Ranged       | Projectile and teleport |
| Assassin  | Fast         | Dash and mobility       |
| Fighter   | Close Combat | Heavy attacks           |

Each character must have configurable:

* HP
* Movement Speed
* Jump Force
* Attack Damage
* Knockback Power
* Ability Cooldown

Character configuration must be separated from gameplay logic.

---

# 5. Controls

| Key | Action       |
| --- | ------------ |
| A   | Move Left    |
| D   | Move Right   |
| W   | Jump         |
| J   | Basic Attack |
| K   | Ability      |
| L   | Ultimate     |

Controls must not depend on the Ctrl key.

---

# 6. Combat Requirements

The combat system must support:

* Attack hitbox
* Hit detection
* Damage calculation
* Knockback
* Attack cooldown
* Hit feedback
* Attack state
* Character-specific attacks

Damage must not be randomly generated.

---

# 7. Damage System

Use a percentage-based damage system.

Example:

```text
0%
25%
50%
100%
150%
```

Higher damage percentage must result in stronger knockback.

Recommended formula:

```text
knockback =
    baseKnockback +
    (damagePercentage * knockbackMultiplier)
```

The values must be configurable.

---

# 8. Arena Requirements

The MVP must contain at least one arena.

The arena must contain:

* Main platform
* Minimum two secondary platforms
* Left boundary
* Right boundary
* Bottom death zone

Example:

```text
             PLATFORM
        ─────────────────

              PLATFORM

   ───────────────────────────
           MAIN PLATFORM

          DEATH ZONE
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

Players must collide correctly with platforms.

---

# 9. Multiplayer Requirements

Socket.IO must be used for real-time communication.

The server must act as the authoritative source for important gameplay state.

The server must manage:

* Player connections
* Player state
* Room state
* Match state
* Damage
* Elimination
* Winner

The client must not independently decide the winner.

---

# 10. Player State

A player state should contain information such as:

```ts
interface PlayerState {
    id: string;
    nickname: string;
    character: CharacterType;

    x: number;
    y: number;

    velocityX: number;
    velocityY: number;

    direction: "left" | "right";

    damage: number;
    hp: number;

    isGrounded: boolean;
    isAlive: boolean;

    isAttacking: boolean;
}
```

The exact structure may be adjusted during implementation.

---

# 11. Room Requirements

Each room must support:

* Create Room
* Join Room
* Leave Room
* Room Code
* Player List
* Host
* Ready State
* Start Match

Room capacity:

```text
Minimum: 2 players
Maximum: 4 players
```

Example room code:

```text
AB12CD
```

---

# 12. Game State

The game must use the following states:

```text
LOBBY
   ↓
ROOM
   ↓
COUNTDOWN
   ↓
PLAYING
   ↓
GAME_OVER
   ↓
RESULT
```

Game state must not be scattered across unrelated React components.

---

# 13. Network Events

## Client → Server

```text
player:join
room:create
room:join
room:leave
player:input
player:attack
player:ability
player:ready
match:start
```

## Server → Client

```text
room:state
player:joined
player:left
game:start
game:state
player:hit
player:eliminated
game:over
```

Network events should use strongly typed payloads.

---

# 14. Client Architecture

Recommended structure:

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    ├── game/
    ├── network/
    ├── hooks/
    ├── types/
    ├── config/
    └── utils/
```

Game logic must not be placed entirely inside React components.

The game loop should be independent from React rendering.

---

# 15. Backend Architecture

Recommended structure:

```text
backend/
└── src/
    ├── server/
    ├── rooms/
    ├── game/
    ├── players/
    ├── network/
    ├── types/
    └── config/
```

Backend responsibilities:

* Manage connections
* Manage rooms
* Manage game sessions
* Validate player actions
* Synchronize game state
* Detect elimination
* Determine winner

---

# 16. Performance Requirements

Target:

```text
~60 FPS
```

Avoid:

* React state updates every frame
* Excessive object allocation
* Sending complete game state unnecessarily
* Running expensive calculations inside React rendering

Use a dedicated game loop.

Use interpolation for remote player movement where appropriate.

---

# 17. UI Requirements

## Main Menu

Must contain:

* Game title
* Nickname input
* Create Room
* Join Room
* Character Selection

## Room Lobby

Must display:

* Room Code
* Player List
* Character
* Ready Status
* Start Match button for Host

## Gameplay HUD

Must display:

* Player nickname
* Character
* Damage percentage
* HP
* Ability cooldown
* Remaining players

## Result Screen

Must display:

* Winner
* Player ranking
* Rematch button
* Return to Lobby button

---

# 18. Development Phases

## Phase 1 — Basic Platformer

Requirements:

* Canvas
* Player
* Movement
* Jump
* Gravity
* Platform collision
* Death zone

Expected result:

A playable single-player platformer.

---

## Phase 2 — Combat

Requirements:

* Basic attack
* Hitbox
* Damage
* Knockback
* Attack cooldown
* Character configuration

Expected result:

Players can attack and knock each other.

---

## Phase 3 — Multiplayer

Requirements:

* Node.js server
* Socket.IO
* Player connection
* Player synchronization
* Remote player rendering

Expected result:

Multiple players can move inside the same arena.

---

## Phase 4 — Room System

Requirements:

* Create room
* Join room
* Room code
* Player list
* Ready system
* Host

Expected result:

Players can create and join multiplayer matches.

---

## Phase 5 — Match System

Requirements:

* Countdown
* Match start
* Elimination
* Winner detection
* Game over
* Result screen

Expected result:

A complete multiplayer match can be played from start to finish.

---

## Phase 6 — Polish

Optional:

* Character animations
* Sound effects
* Background music
* Screen shake
* Hit effects
* Particle effects
* Better UI
* Character sprites
* Arena variations

---

# 19. MVP Definition

The MVP is considered complete when:

* [ ] Player can move
* [ ] Player can jump
* [ ] Platforms have collision
* [ ] Player can attack
* [ ] Attack causes damage
* [ ] Damage causes knockback
* [ ] Player can fall out of the arena
* [ ] Two players can connect simultaneously
* [ ] Players can see each other
* [ ] Players can attack each other
* [ ] Server synchronizes important game state
* [ ] Player elimination works
* [ ] Winner detection works
* [ ] Room creation works
* [ ] Room joining works
* [ ] Match can start
* [ ] Match can end
* [ ] Result screen works

---

# 20. Non-Goals for MVP

Do NOT implement these before the MVP is complete:

* Ranked matchmaking
* Authentication
* Database
* Shop
* Skins
* Gacha
* Inventory
* Friends system
* Voice chat
* Mobile controls
* Multiple maps
* Advanced AI
* Complex progression system

These may be implemented in future versions.

---

# 21. Code Quality Requirements

The project must:

* Use TypeScript.
* Avoid unnecessary `any`.
* Keep frontend and backend separated.
* Keep game logic modular.
* Keep network logic separate from rendering logic.
* Keep character configuration separate from combat logic.
* Use reusable components.
* Use clear naming conventions.
* Include basic error handling.
* Include `.env.example`.
* Include `README.md`.

---

# 22. Definition of Done

The project is considered an MVP when four players can:

1. Open the website.
2. Enter their nickname.
3. Create or join a room.
4. Select a character.
5. Ready up.
6. Start a match.
7. Move around the arena.
8. Attack other players.
9. Cause damage.
10. Knock players away.
11. Eliminate players by knocking them out of the arena.
12. Determine one winner.
13. See the result screen.
14. Return to the lobby.
