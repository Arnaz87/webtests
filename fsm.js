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

fsm.str = new Object();
// Base para evaluacion de Strings
  //*/

  fsm.EvalString = function (machine, str) {

    Pos = function (st, ch) {
      this.state = st;
      this.ch = ch;
      this.getState = function () {
        return machine[this.state];
      }
      this.getChar = function () {
        return str[this.ch];
      }
    }

    var positions = [new Pos(1, 0)];
    var cont = true;
    var result = true;

    var evalNext = function () {
      var pos = positions.pop();
      var state = machine[pos.state];
      var ch = str[pos.ch];
      var link;
      var result;

      var end = false;

      for (var i = 0; i < state.length; i++) {
        link = state.get(i);
        result = link.eval(ch);

        if (result) {
          var nch = pos.ch + ((result==1)? 1 : 0);
          var npos = new Pos(link.out, nch);
          positions.push(npos);
          end = end || machine[link.out].end
        }
      }

      return end;
    }

    while(cont) {
      for (var i = 0; i < positions.length; i++) {
        var pos = positions[i]
        if (machine[pos.state].end) {
          if (pos.ch == str.length) {
            return true;
          }
        }
      };
      evalNext();
      if (positions.length == 0) {
        return false;
      }
    }

    return result;
  }

  fsm.Pos = function (st, ch) {
    this.state = st;
    this.ch = ch;
    this.toString = function () {
      return "(state:" + st + ",ch[" + ch + "]:" + str[ch] + ")";
    }
  }

  var machine = fsm.format_compile("1:(a,1)(b,2);2:*(a,1)(b,2);");
  var str = "aaabbb";

  var positions = [new fsm.Pos(1,0)];

  function evalNext () {
    var pos = positions.pop();
    var state = machine[pos.state];
    var ch = str[pos.ch];
    var link;
    var result;
    for (var i = 0; i < state.length; i++) {
      link = state.get(i);
      result = link.eval(ch);
      if (result == 1) {
        positions.push(new fsm.Pos(link.out, pos.ch + 1));
      }
      if (result == 2) {
        positions.push(new fsm.Pos(link.out, pos.ch));
      }
    }
    console.log(positions);
  }

  function evalPos (ch) {
    var pos = positions.pop();
    var state = machine[pos.state];
    var link;
    for (var i = 0; i < state.length; i++) {
      link = state.get(i);
      if (link.eval(ch)) {
        positions.push(new fsm.Pos(link.out));
      }
    }

    console.log(positions);
  }
  //*/
// fin de seccion