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
    this.toString = function () {
      return "(" + this.ch + "," + this.out + ")";
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
    this.toString = function () {
      var str = "";
      for (var i = 0; i < this.length; i++) {
        str += this.links[i].toString();
      };
      return str;
    }
  }

  fsm.Machine = function () {
    this.toString = function () {
      var str = "";
      for (var i in this) {
        if (typeof this[i] != "function") {
          str += i + ":" + this[i].toString() + ";";
        }
      };
      return str;
    };
  }
// end section

fsm.str = new Object();
// Base for String Evaluation
  /*/
  fsm.str.Pos = function (i) {
    this.i = i;
    this.state = states[i];
    this.length = this.state.length;
  }

  var machine = fsm.format_compile("1:(a,1)(b,2);2:(a,1)(b,2)");

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
  //*/
// end section

// Base for Fsm format

  /* Info
    Un String representa una máquina completa.
    Un estado está formado por un nombre asociado a varios links.
    Se escribe el nombre, seguido de dos puntos, y una lista de links,
    delimitados entre paréntesis, no por coma, e indicando el final del
    estado con un punto y coma.
    Nombre:(Link1)(Link2)(Link3);
    El nombre de un estado empieza con un asterisco si es un estado final.
    Un link esta formado por un caracter, una coma y el nombre de un estado.
    Ejemplo de una máquina:
    1:(a,1)(b,2);*2:(a,1)(b,2);
    */

  fsm.format_compile = function (str) {
    var mach = new fsm.Machine();

    var linestart = 0;
    var colon = 0;
    var linkstart = 0;
    var name = null;
    var state = null;

    var link = function (start, end) {
      var comma;
      for (var i = start; i < end; i++) {
        if (str[i] == ",") {
          comma = i;
        }
      }
      var ch = str.slice(start, comma);
      var out = str.slice(comma + 1,  end);
      return new fsm.Link(ch, out);
    }

    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch == ";") { // End of line
        mach[name] = state;
        linestart = i + 1;
        i += 1;
      }
      if (ch == ":") { // Name
        colon = i;
        name = str.slice(linestart, i);
        state = new fsm.State();
      }
      if (ch == "(") { // Link Start
        linkstart = i + 1;
      }
      if (ch == ")") { // Link End
        state.push(link(linkstart, i));
      }
    };
    return mach;
  }
// end section