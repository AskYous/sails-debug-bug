/**
* List of available actions
*/
var Action;
(function (Action) {
    Action[Action["played"] = 0] = "played";
    Action[Action["startedSeek"] = 1] = "startedSeek";
    Action[Action["endedSeek"] = 2] = "endedSeek";
    Action[Action["paused"] = 3] = "paused";
    Action[Action["loaded"] = 4] = "loaded";
    Action[Action["muted"] = 5] = "muted";
    Action[Action["unmuted"] = 6] = "unmuted";
})(Action || (Action = {}));
//# sourceMappingURL=Action.js.map