fsm = new Object();

// Base para el Automata Finito
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
      if (this.end) {
        str += "*";
      }
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
// fin de seccion

// Base para la descripcion de FSM

  /* Info
    Un String representa una máquina completa.
    Un estado está formado por un nombre asociado a varios links.
    Se escribe el nombre, seguido de dos puntos, y una lista de links,
    delimitados entre paréntesis, no por coma, e indicando el final del
    estado con un punto y coma.
    Nombre:(Link1)(Link2)(Link3);
    Si un estado es final, se pone un asterisco al principio del nombre
    o después de los dos puntos.
    Un link esta formado por un caracter, una coma y el nombre de un estado.
    Ejemplo de una máquina:
    1:(a,1)(b,2);*2:(a,1)(b,2);
    */

  /* Algoritmo
    Este algoritmo está basado en las tecnicas de las maquinas virtuales.
    Interpreta el formato como un lenguaje de notación postfijo.
    Algunos caracteres se interpretan como comandos y el resto como texto.
    Los límites indican donde comienza y termina una porción de texto.
    Existen dos límites, el inicio y el final.
    Cuando se marca un limite, siempre se marca el final, y el que antes
    era el límite final pasa a ser el límite de inicio.
    Por ejemplo si los límites son 0 y 5, esto representa todo el texto que
    se encuentra entre estas dos posiciones. Si se marca un límite 10,
    el texto 0,5 se remplaz por el texto entre 5 y 10.
    Todos los comandos marcan el caracter en que se encuentran y actuan
    como delimitadores en el texto.

    La explicación de los comandos:
    ; guarda el estado anterior y crea uno nuevo.
    : asigna el texto marcado como nombre para el estado actual.
    ( crea un nuevo Link.
    , asigna el texto marcado como caracter del Link.
    ) asigna el texto marcado como direccion del link y lo guarda en el estado actual.
    * indica que el estado actual es un estado final.

    */

  fsm.format_compile = function (str) {
    var mach = new fsm.Machine();

    var mark1 = 0, mark2 = -1; // -1 para que el salto de caracter lleve a 0.
    var name = null;
    var state = new fsm.State();
    var link = null;

    var mark = function (val) {
      mark1 = mark2 + 1; // + 1 para saltar el caracter del comando.
      mark2 = val;
    }

    var marked = function () {
      return str.slice(mark1, mark2);
    }

    for (var i = 0; i < str.length; i++) {
      var ch = str[i];

      if (ch == ";") {
        mark(i);
        mach[name] = state;
        state = new fsm.State();
      }
      if (ch == ":") {
        mark(i);
        name = marked();
      }
      if (ch == "(") {
        mark(i);
        link = new fsm.Link();
      }
      if (ch == ")") {
        mark(i);
        link.out = marked();
        state.push(link);
      }
      if (ch == ",") {
        mark(i);
        link.ch = marked();
      }
      if (ch == "*") {
        mark(i);
        state.end = true;
      }

    };
    return mach;
  }
// fin de seccion

// Base para evaluacion de Strings

  fsm.Pos = function (st, ch) {
    this.state = st;
    this.ch = ch;
    this.toString = function () {
      return "(state:" + st + ",ch[" + ch + "]:" + str[ch] + ")";
    }
  }

  fsm.Evaluator = function (machine, string) {
    this.machine = machine;
    this.str = string;
    this.start = 0;
    this.end = null;
    this.positions = [];
    this.canContinue = false;

    this.init = function (start) {
      this.start = start;
      this.positions = [new fsm.Pos(1, start)];
      this.canContinue = true;
    }

    this.evalNext = function () {
      var pos = this.positions.pop();
      var state = this.machine[pos.state];
      var ch = this.str[pos.ch];

      var link, result;

      for (var i = 0; i < state.length; i++) {
        link = state.get(i);
        result = link.eval(ch)

        if (result) {
          this.pushNewPos(link.out, pos.ch + 1, pos.ch);
        }
      };
      if (this.positions.length == 0) {
        this.canContinue = false;
      }
    };

    this.pushNewPos = function (st, ch, currentCh) {
      pos = new fsm.Pos(st, ch);
      this.positions.push(pos);
      this.checkEnd(machine[st], currentCh);
    };

    this.checkEnd = function () {};
  }

  fsm.fullMatch = function (machine, str) {
    var evaluator = new fsm.Evaluator(machine, str);
    evaluator.end = false;
    evaluator.checkEnd = function (state, ch) {
      if (state.end) {
        if (ch == this.str.length - 1) {
          this.end = true;
        }
      }
    };

    evaluator.init(0);
    while (evaluator.canContinue) {
      evaluator.evalNext();
    }
    return evaluator.end;
  }

  fsm.find = function (machine, str) {
    var evaluator = new fsm.Evaluator(machine, str);
    evaluator.end = -1;
    evaluator.checkEnd = function (state, ch) {
      if (state.end) {
        if (ch > this.end) {
          this.end = ch;
        }
      }
    };
    var i = 0;
    while(i < str.length) {
      evaluator.init(i);
      while (evaluator.canContinue) {
        evaluator.evalNext();
      }
      if (evaluator.end >= 0) {
        return [i, evaluator.end];
      }
      i++;
    }
    return false;
  }

  fsm.partialMatch = function (machine, str) {
    var result = fsm.find(machine, str);
    return !(result == false);
  }

  fsm.extract = function (machine, str) {
    var result = fsm.find(machine, str);
    if (result != false) {
      return str.slice(result[0], result[1]+1);
    }
    return false;
  }
// fin de seccion