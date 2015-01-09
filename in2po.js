var ops = {
  "regex": [
    ["|", "in", 1],
    [".", "in", 2],
    ["+", "post", 3],
    ["*", "post", 3],
    ["?", "post", 3],
    ["(", "open", 0],
    [")", "close", 0]
  ],
  "math": [
    ["+", "in", 1],
    ["-", "in", 1],
    ["*", "in", 2],
    ["/", "in", 2],
    ["n", "pre", 3],
    ["i", "pre", 3],
    ["(", "open", 0],
    [")", "close", 0]
  ]
}

function in2po (str) {
  var out = "";
  var stack = [];

  var set = ops["regex"];

  var add = function (ch) {
    out = out + ch;
    }
  var last = function () {
    return stack[stack.length - 1];
    }
  var pop = function () {
    return stack.pop();
    }
  var push = function (val) {
    stack.push(val);
    }
  var find = function (ch) {
    for (var i in set) {
      if (set[i][0] == ch) {
        return set[i];
      }
    }
    return null;
    }

  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    var op = find(ch);
    if (!op) {
      add(ch);
    } else if (op[1] == "open") {
      push(op);
    } else if (op[1] == "close") {
      while (last()[2] > op[2]) {
        add(pop()[0]);
      }
      pop();
    } else {
      while (last() != undefined && last()[2] >= op[2]) {
        add(pop()[0]);
      }
      if (op[1] == "post") {
        add(op[0]);
      } else {
        push(op);
      }
    }
  }
  while (last() != undefined) {
    add(pop()[0]);
  }

  return out;
}