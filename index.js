"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tail = require("tail");

var _tail2 = _interopRequireDefault(_tail);

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var mtga_path = (process.env.HOME || process.env.USERPROFILE) + "\\AppData\\LocalLow\\Wizards Of The Coast\\MTGA\\output_log.txt";

var Parser = function (_EventEmitter) {
    _inherits(Parser, _EventEmitter);

    function Parser() {
        _classCallCheck(this, Parser);

        return _possibleConstructorReturn(this, (Parser.__proto__ || Object.getPrototypeOf(Parser)).apply(this, arguments));
    }

    _createClass(Parser, [{
        key: "handleLine",
        value: function handleLine(line) {
            var matches = void 0;
            if ((matches = line.match(/^==>\s(.+)\(.+$/)) || (matches = line.match(/^\[Client GRE\].+to\sMatch:\s(.+)/))) {
                // outgoing event
                this.event = "==> " + matches[1];
            } else if ((matches = line.match(/^<==\s(.+)\(.+$/)) || (matches = line.match(/^\[Client GRE\].+Match\sto\s.+:\s(.+)/))) {
                // incoming event
                this.event = "<== " + matches[1];
            } else if (matches = line.match(/^\(-?\d+\)\sIncoming\s(.+)\s(\[|\{)/)) {
                // incoming event
                this.event = "<== " + matches[1];
                this.data = matches[2];
            } else if (matches = line.match(/^(\[|\{)\r?$/)) {
                this.data = matches[1];
            } else if (matches = line.match(/^(\]|\})\r?$/)) {
                // finished event
                this.data += matches[1];
                try {
                    var data = JSON.parse(this.data);
                    this.emit("debug", this.event, data.params || data);
                    this.emit(this.event, data.params || data);
                } catch (e) {
                    console.log(e);
                }
            } else if (this.event && (matches = line.match(/^\s\s/))) {
                // event data
                this.data += matches.input;
            }
        }
    }, {
        key: "start",
        value: function start() {
            var log_path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : mtga_path;

            if (this.tailStream !== undefined) {
                return console.error("already started. call restart to restart from the beginning of the file");
            }
            this.tailStream = new _tail2.default.Tail(log_path, { fromBeginning: true });
            this.tailStream.on("line", this.handleLine.bind(this));
        }
    }, {
        key: "restart",
        value: function restart() {
            if (this.tailStream == undefined) {
                return this.start();
            }
            this.tailStream.unwatch();
            this.tailStream = undefined;
            this.start();
        }
    }]);

    return Parser;
}(_events.EventEmitter);

exports.default = Parser;