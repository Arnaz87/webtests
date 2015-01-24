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
      return "(" + this.ch + "," + this.out.name + ")";
    }
  }

  fsm.State = function () {
    this.links = [];
    this.name = null;
    this.length = 0;
    this.push = function (link) {
      this.links.push(link);
      this.length += 1;
    }
    this.get = function (i) {
      return this.links[i];
    }
    this.evalAt = function (ch, i) {
      return this.links[i].eval(ch);
    }
    this.end = false;
    this.toString = function () {
      var str = "";
      if (this.end) {
        str += "*";
      }
      str += this.name;
      str += ":";
      for (var i = 0; i < this.length; i++) {
        str += this.links[i].toString();
      };
      return str;
    }
  }

  fsm.Machine = function () {
    this.start = 1;
    this.states = [];
    this.push = function (state) {
      this.states.push(state);
    }
    this.get = function (name) {
      for (var i in this.states) {
        if (name == this.states[i].name) {
          return this.states[i];
        }
      };
      return null;
    }
    this.toString = function () {
      var str = "";
      str += "start = " + this.start.name + "\n";
      for (var i in this.states) {
        str += this.states[i].toString() + ";\n";
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
        //mach[name] = state;
        mach.push(state);
        state = new fsm.State();
      }
      if (ch == ":") {
        mark(i);
        name = marked();
        state.name = name;
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
      if (ch == "\n" || ch == "\r") { // Este solo marca, para ignorar los saltos de linea.
        mark(i);
      }

    };
    return mach;
  }
// fin de seccion

// Base para evaluacion de Strings

  fsm.Pos = function (st, ch, str) {
    //Una posición es un estado "state" que va a revisar el string en "ch".
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
    this.maxCount = 4096;
    this.maxPositions = 512;
    this.count = 0;

    this.init = function (start) {
      this.start = start;
      this.positions = [new fsm.Pos(this.machine.start, start, this.str)];
      this.canContinue = true;
      this.count = 0;
    }

    this.evalNext = function () {
      var pos = this.positions.pop();
      var state = pos.state;
      var ch = this.str[pos.ch];

      var link, result;

      for (var i = 0; i < state.length; i++) {
        link = state.get(i);
        result = link.eval(ch)

        if (result) {
          var newch = pos.ch + ((result == 1)? 1 : 0);
          this.pushNewPos(link.out, newch);
        }
      };
      if (this.positions.length == 0) {
        this.canContinue = false;
      }
      if (this.count > this.maxCount) {
        this.canContinue = false;
        console.error("Max count exceded!! Please redesign the machine: " + String(this.machine));
      }
      if (this.positions.length > this.maxPositions) {
        this.canContinue = false;
        console.error("Max positions count exceded!! Please redesign the machine: " + String(this.machine));
      }
    };

    this.pushNewPos = function (st, ch) {
      this.count++;
      pos = new fsm.Pos(st, ch, this.str);
      this.positions.push(pos);
      this.checkEnd(st, ch - 1);
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
      if (evaluator.end == true) {
        break;
      }
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

// Base para construccion de Regex

  fsm.regex_compile = function (str) {

    var Section = function (start, end) {
      this.start = start;
      this.end = end;
    }

    var newState = function () {
      var key = nextState;
      nextState++;
      var state = new fsm.State();
      //machine[key] = state;
      state.name = key;
      machine.push(state);
      return state;
    }

    var createSection = function () {
      return new Section(newState(), newState());
    }

    var pushLink = function (a, ch, b) {
      a.push(new fsm.Link(ch, b));
    }

    var nextState = 1;
    var machine = new fsm.Machine();
    var sections = [];

    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      switch (ch) {
        case '.':
          var s2 = sections.pop();
          var s1 = sections.pop();
          pushLink(s1.end, "", s2.start);
          var sec = new Section(s1.start, s2.end);
          sections.push(sec);
          break;
        case '|':
          var s2 = sections.pop();
          var s1 = sections.pop();
          var sec = createSection();

          pushLink(sec.start, "", s1.start);
          pushLink(sec.start, "", s2.start);
          pushLink(s1.end, "", sec.end);
          pushLink(s2.end, "", sec.end);

          sections.push(sec);
          break;
        case '?':
          var sec = sections.pop();
          pushLink(sec.start, "", sec.end);
          sections.push(sec);
          break;
        case '+':
          var sec = sections.pop();
          pushLink(sec.end, "", sec.start);
          sections.push(sec);
          break;
        case '*': // Optimizar...
          var sec = sections.pop();
          var st1 = sec.end;
          var st2 = newState();
          st1.push(new fsm.Link("", sec.start));
          st1.push(new fsm.Link("", st2));
          sec.start.push(new fsm.Link("", st2));
          sec.end = st2;
          sections.push(sec);
          break;
        default:
          var sec = createSection();
          pushLink(sec.start, ch, sec.end);
          sections.push(sec);
          break;
      }
    };
    var section = sections.pop();
    section.end.end = true;
    machine.start = section.start;

    return machine;
  }
// fin de seccion

// Base para conversion a DFA

  fsm.toDFA = function (machine) {

    var Grupo = function () {
      this.estados = [];
      this.links = [];
      this.estado = null;
      this.end = false;
      this.push = function (estado) {
        for (var i in this.estados) {
          if (this.estados[i] == estado)
            return;
        }
        this.estados.push (estado);
        this.end = this.end || estado.end;
      }
      this.pushLink = function (link) {
        var mlink = this.getLink(link.ch);
        if (!mlink) {
          mlink = new Mlink(link.ch);
          this.links.push(mlink)
        }
        mlink.push(link.out);
      }
      this.getLink = function (ch) {
        for (var i in this.links) {
          var link = this.links[i];
          if (link.ch == ch)
            return link;
        }
        return null;
      }
      this.toString = function () {
        var str = "";
        if (this.end) {
          str += "*";
        }
        for (var i in this.estados) {
          str += this.estados[i].name + ",";
        }
        str = str.slice(0, -1) + ":";

        for (var i in this.links) {
          str += "(" + this.links[i].toString() + "),";
        }
        str = str.slice(0, -1);
        return "<" + str + ">";
      }
      this.join = function () {
        str = "";
        sorted = this.estados.sort();
        for (var i in this.estados) {
          str += this.estados[i].name + ",";
        }
        return str.slice(0, -1);
      }
    }

    var Mlink = function (ch) {
      this.ch = ch;
      this.out = [];
      this.grupo = null;
      this.push = function (estado) {
        for (var i in this.out) {
          if (this.out[i] == estado) {
            return;
          }
        }
        this.out.push(estado)
      }
      this.toString = function () {
        str = this.ch + ":";
        for (var i in this.out) {
          str += this.out[i].name + ",";
        }
        return str.slice(0, -1);
      }
    }

    var dfa = new fsm.Machine();
    var next = 1;
    var grupos = [];

    var getGrupo = function (grupo) {
      for (var i in grupos) {
        if (grupos[i].join() == grupo.join())
          return grupos[i];
      }
      return null;
    }

    var gruposContains = function (grupo) {
      var val = getGrupo(grupo);
      return (val != null) && (val != undefined);
    }

    var procesarEstado = function (grupo, estado) {
      grupo.push(estado);
      for (var i in estado.links) {
        var link = estado.links[i];
        if (link.ch == "") {
          procesarEstado(grupo, link.out);
        } else {
          grupo.pushLink(link);
        }
      }
    }

    var crearGrupo = function (estados) {
      var grupo = new Grupo();
      for (var i in estados) {
        procesarEstado(grupo, estados[i]);
      }
      if (gruposContains(grupo))
        return getGrupo(grupo);
      grupos.push(grupo);
      for (var i in grupo.links) {
        var mlink = grupo.links[i];
        mlink.grupo = crearGrupo(mlink.out);
      }
      return grupo;
    }

    crearGrupo([machine.start])

    return grupos;
  }
// fin de seccion

/*
Algoritmo
==========

grupos = []

ProcesarEstado(estado inicial)

def ProcesarEstado (estado)
  grupo = new Grupo(estado)
  existe = Push(grupo)
  if existe
    return existe
  links = ExtraerLinks(grupo)
  for link in links
    nuevo = ProcesarEstado(link.out)
    grupo.estado.push(new Link(link.ch, nuevo.estado))
  return grupo

def Push (grupo)
  if grupos.contains(grupo)
    return grupos.find(grupo)
  else
    grupos.push(grupo)

def ExtraerLinks (grupo)
  links = []
  for estado in grupo
    for link in estado.links
      if !link.epsilon
        links.push(link)
    links.concat(estado.links)
  return links

class Grupo (estado)
  this = []
  this.push(estado)
  for link in estado.links
    if link.epsilon
      this.concat(new Grupo(link.out))
*/