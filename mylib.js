//Funciones tipo Angular

  ml = new Object();
  ml.models = {};
  ml.binds = {};
  ml.refreshes = [];
  ml.inits = [];
  ml.Bind = function () {
    this.element = null;
    this.binds = [];
  }

  $(function () {
    $('input[ml-model]').each(function () {
      ml.initModel($(this), 'keyup');
    });

    $('[ml-bind]').each(function () {
      ml.initBind($(this));
    });

    for (var i in ml.inits) {
      ml.inits[i]();
    }

    for (var i in ml.binds) {
      ml.refreshModel(i);
    }
  });

  ml.init = function (func) {
    ml.inits.push(func);
  }

  ml.refresh = function (func) {
    if (func) {
      ml.refreshes.push(func);
    } else {
      for (var i in ml.refreshes) {
        ml.refreshes[i]();
      }
    }
  }

  ml.getBind = function (name) {
    var bind = ml.binds[name];
    if (!bind) {
      bind = new ml.Bind ();
      ml.binds[name] = bind;
    }
    return bind;
  }

  ml.initModel = function (obj, evt) {
    var name = obj.attr('ml-model');
    var bind = ml.getBind(name);
    bind.element = obj;
    obj.on(evt, function () {
      ml.refreshModel(name);
      ml.refresh();
    })
  }

  ml.refreshModel = function (name) {
    var bind = ml.getBind(name);
    ml.useModel(name, bind.element.val());
    for (var i in bind.binds) {
      bind.binds[i].text(ml.useModel(name));
    }
  }

  ml.initBind = function (obj) {
    name = obj.attr('ml-bind');
    var bind = ml.getBind(name);
    bind.binds.push(obj);
  }

  ml.useModel = function (sel, val) {

    var setval = (val != undefined);

    // Make Array
    var str = sel;
    str = str.replace(/\[/g, '.');
    str = str.replace(/\]/g, '');
    str = str.replace(/\(\)/g, '.()');
    var arr = str.split('.');

    //Select Array
    var current = ml.models;
    var last = arr.length - 1;
    for (var i = 0; i < arr.length; i++) {
      var sethere = (i == last) && setval;
      next = arr[i];
      if (next == '()') {
        if (sethere) {
          current = current(val);
        } else {
          current = current();
        }
      } else {
        if (sethere) {
          var temp = current[next];
          current[next] = val;
          current = temp;
        } else {
          current = current[next];
        }
      }
    };
    return current;
  }

//Funciones Para Datos.

  ml.tourl = function () {
    if (scope == undefined || scope == null) {
      scope = "";
    }
    str = "";
    switch (typeof obj) {
      case 'object':
        com = false;
        for (var i in obj) {
          if (com) {
            str += "&";
          } else {
            com = true;
          }
          if (scope == "") {
            nscope = i;
          } else {
            nscope = scope + '[' + i + ']';
          }
          str += ml.tourl(obj[i], nscope);
        }
        break;
      default:
        str += scope + "=";
        str += ml.urlstr(obj);
        break;
    }
    return str;
  }

  ml.urlstr = function () {
    return String(obj).replace(' ', '+');
  }

  ml.addObject = function (form, obj, scope) {
    if (scope == undefined || scope == null) {
      scope = "";
    }
    switch (typeof obj) {
      case 'object':
        for (var i in obj) {
          if (scope == "") {
            nscope = i;
          } else {
            nscope = scope + '[' + i + ']';
          }
          ml.addObject(form, obj[i], nscope);
        }
        break;
      case 'array':
        ml.addValue(form, scope, 'array');
      default:
        ml.addValue(form, scope, obj)
        break;
    }
    return form;
  }

  ml.addValue = function (form, key, value) {
    inp = $('<input>');
    inp.attr('type', 'hidden');
    inp.attr('name', key);
    inp.val(value);
    form.append(inp);
  }

  ml.tojson = function (obj, tab) {

    var tostr = function (obj) {
      var str = String(obj);
      return '"' + str + '"';
    }

    if (tab == undefined || tab == null) {
      tab = "";
    } else {
      tab = tab + "  ";
    }

    str = "";
    switch (typeof obj) {
      case 'string':
        str += tostr(obj);
        break;
      case 'object':
        if (obj == null) {
          str += 'null';
        } else if (obj.hasOwnProperty('toString')) {
          str += obj.toString().replace(/\n/g, tab + '\n');
        } else  if (false && obj instanceof Array) {
          str += '\n' + tab + '[\n';
          com = false;
          for (var i in obj) {
            if (com) {
              str += ",\n";
            } else {
              com = true;
            }
            str += ml.tojson(obj[i], tab);
          }
          str += "\n" + tab + ']';
        } else {
          str += '\n' + tab + '{\n';
          com = false;
          for (var i in obj) {
            if (com) {
              str += ",\n";
            } else {
              com = true;
            }
            str += tab;
            str += tostr(i) + ": ";
            str += ml.tojson(obj[i], tab);
          }
          str += "\n" + tab + '}';
        }
        break;
      case 'number':
        str += String(obj);
        break;
      case 'function':
        str += 'function ()';
        break;
      case 'boolean':
        str += String(obj);
        break;
      case 'undefined':
        str += 'undefined';
        break;
      default:
        str += 'XXXXX';
        break;
    }
    return str;
  }