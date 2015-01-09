fsm = new Object();
// Base for Finite State Machines
  fsm.Link = function (ch, out) {
    this.ch = ch;
    this.out = out;
    this.eval = function (ch) {
      if (this.ch == "") {
        return 2; // 2 significa JUMP, pasa al siguiente estado pero en el mismo caracter.
      }
      if (this.ch == ch) {
        return 1; // 1 significa PASS, pasa al siguiente estado y al siguiente caracter.
      }
      return 0;   // 0 significa FAIL, no pasa al siguiente estado y rompe el automata.
    }
  }

  fsm.State = function (links, end) {
    if (links == null || links == undefined) {
      links = [];
    }
    this.links = links;
    this.length = links.length;
    this.push = function (link) {
      this.links.push(link);
      this.length += 1;
    }
    this.get = function (i) {
      return links[i];
    }
    this.evalAt = function (ch, i) {
      return links[i].eval(ch);
    }
    if (end) {
      this.end = true;
    } else {
      this.end = false;
    }
  }

  fsm.Machine = function () {
  }
// end section

fsm.str = new Object();
// Base for String Evaluation
/*
  fsm.str.Pos = function (i) {
    this.i = i;
    this.state = states[i];
    this.length = this.state.length;
  }

  var states = {
    1: new State([new Link("a", 2)]),
    2: new State([new Link("b", 2), new Link("", 3)]),
    3: new State([new Link("c", "end")]),
    "end": new State([], true)
  };

  var positions = [new Pos(1)];

  function evalPos (ch) {
    var pos = positions.pop();
    var link;
    for (var i = 0; i < pos.length; i++) {
      link = pos.state.get(i);
      if (link.eval(ch)) {
        positions.push(new Pos(link.out));
      }
    }

    console.log(positions);
  }
  */
// end section

// Base for Fsm format

fsm.format_compile = function (str) {
  var mach = new fsm.Machine();

  var linestart = 0;
  var colon = 0;
  var name = null;
  var state = null;
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    if (ch == ";") { // New Line
      state = str.slice(colon+1, i);
      mach[name] = state;
      linestart = i + 1;
      i += 1;
    }
    if (ch == ":") { // Name
      colon = i;
      name = str.slice(linestart, i);
    }
  };
  return mach;
}

// end section