// ============================================================
// Brawl Impact - Shared Types
// ============================================================
// --- Enums ---
export var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "LOBBY";
    GamePhase["ROOM"] = "ROOM";
    GamePhase["COUNTDOWN"] = "COUNTDOWN";
    GamePhase["PLAYING"] = "PLAYING";
    GamePhase["GAME_OVER"] = "GAME_OVER";
    GamePhase["RESULT"] = "RESULT";
})(GamePhase || (GamePhase = {}));
export var CharacterType;
(function (CharacterType) {
    CharacterType["KNIGHT"] = "KNIGHT";
    CharacterType["MAGE"] = "MAGE";
    CharacterType["ASSASSIN"] = "ASSASSIN";
    CharacterType["FIGHTER"] = "FIGHTER";
})(CharacterType || (CharacterType = {}));
export var AttackType;
(function (AttackType) {
    AttackType["BASIC"] = "BASIC";
    AttackType["ABILITY"] = "ABILITY";
    AttackType["ULTIMATE"] = "ULTIMATE";
})(AttackType || (AttackType = {}));
export var Direction;
(function (Direction) {
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (Direction = {}));
// --- Network Events ---
export var ClientEvent;
(function (ClientEvent) {
    ClientEvent["PLAYER_JOIN"] = "player:join";
    ClientEvent["ROOM_CREATE"] = "room:create";
    ClientEvent["ROOM_JOIN"] = "room:join";
    ClientEvent["ROOM_LEAVE"] = "room:leave";
    ClientEvent["PLAYER_INPUT"] = "player:input";
    ClientEvent["PLAYER_READY"] = "player:ready";
    ClientEvent["PLAYER_SELECT_CHARACTER"] = "player:selectCharacter";
    ClientEvent["MATCH_START"] = "match:start";
})(ClientEvent || (ClientEvent = {}));
export var ServerEvent;
(function (ServerEvent) {
    ServerEvent["ROOM_STATE"] = "room:state";
    ServerEvent["PLAYER_JOINED"] = "player:joined";
    ServerEvent["PLAYER_LEFT"] = "player:left";
    ServerEvent["GAME_START"] = "game:start";
    ServerEvent["GAME_STATE"] = "game:state";
    ServerEvent["PLAYER_HIT"] = "player:hit";
    ServerEvent["PLAYER_ELIMINATED"] = "player:eliminated";
    ServerEvent["GAME_OVER"] = "game:over";
    ServerEvent["ERROR"] = "error";
    ServerEvent["ROOM_CREATED"] = "room:created";
    ServerEvent["COUNTDOWN_TICK"] = "countdown:tick";
})(ServerEvent || (ServerEvent = {}));
