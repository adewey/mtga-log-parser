import tail from "tail";
import { EventEmitter } from "events";

const mtga_path = `${process.env.HOME || process.env.USERPROFILE}\\AppData\\LocalLow\\Wizards Of The Coast\\MTGA\\output_log.txt`;

export default class Parser extends EventEmitter {
    handleLine(line) {
        let matches;
        if ((matches = line.match(/^==>\s(.+)\(.+$/)) ||
            (matches = line.match(/^\[Client GRE\].+to\sMatch:\s(.+)/))) {
            // outgoing event
            this.event = `==> ${matches[1]}`;
        }
        else if ((matches = line.match(/^<==\s(.+)\(.+$/)) ||
                 (matches = line.match(/^\[Client GRE\].+Match\sto\s.+:\s(.+)/))) {
            // incoming event
            this.event = `<== ${matches[1]}`;
        }
        else if (matches = line.match(/^\(-?\d+\)\sIncoming\s(.+)\s(\[|\{)/)) {
            // incoming event
            this.event = `<== ${matches[1]}`;
            this.data = matches[2];
        }
        else if (matches = line.match(/^(\[|\{)\r?$/)) {
            this.data = matches[1];
        }
        else if (matches = line.match(/^(\]|\})\r?$/)) {
            // finished event
            this.data += matches[1];
            try {
                let data = JSON.parse(this.data);
                this.emit("debug", this.event, data.params || data);
                this.emit(this.event, data.params || data);
            } catch (e) { console.log(e); }
        }
        else if (this.event && (matches = line.match(/^\s\s/))) {
            // event data
            this.data += matches.input;
        }
    }

    start(log_path = mtga_path) {
        if (this.tailStream !== undefined) {
            return console.error("already started. call restart to restart from the beginning of the file");
        }
        this.tailStream = new tail.Tail(log_path, { fromBeginning: true });
        this.tailStream.on("line", this.handleLine.bind(this));
    }

    restart() {
        if (this.tailStream == undefined) {
            return this.start();
        }
        this.tailStream.unwatch();
        this.tailStream = undefined;
        this.start();
    }
}
