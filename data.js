data = {};
data.arnaud = {};

data.arnaud.complex = {
  nombre: 'Arnaud',
  apellido: 'Castellanos',
  edad: 16,
  familia: {
    padre: {
      nombre: 'Eleuterio',
      apellido: 'Castellanos',
      edad: '37'
    },
    madre: {
      nombre: 'Victoria',
      apellido: 'Galea',
      edad: '36'
    },
    hermanas: [
      {
        nombre: 'Alicia',
        apellido: 'Castellanos',
        edad: 12
      }, 
      {
        nombre: 'Alanis',
        apellido: 'Castellanos',
        edad: 11
      }
    ]
  }
};

data.arnaud.simple = {
  nombre: 'Arnaud',
  apellido: 'Castellanos',
  edad: 16
};

data.saludos = {
  hola: {
    text: 'HOLALALA',
    ops: {
      '1': 'HOLALALITAS',
      '2': 'COMO ESTAN TODOS',
      '3': 'LLEGUE YO!!!'
    }
  },
  chao: {
    text: 'CHAOTES',
    ops: {
      '1': 'CHAO MI GENTE',
      '2': 'HASTA LUEGOTES',
      '3': 'A DORMIR PINCHES VAGOS'
    }
  },
  hi: {
    text: 'HELLO THERE',
    ops: {
      '1': 'HELLO ALL PEOPLE',
      '2': 'WAZUP BRO',
      '3': 'YO, MR. ME HAS ARRIVED NIGGAS(?'
    }
  },
  bye: {
    text: 'GOOD BYE BYE',
    ops: {
      '1': 'SEE YOU LATER',
      '2': 'MOTHER FUCKERS GET OUT OF MY PLACE',
      '3': 'IMMA CALL THE POLICE'
    }
  }
}

data.artecol = {};

data.artecol.categorias = [
  {id: 1, nombre: 'cables', tipo: 'm'},
  {id: 2, nombre: 'cuerdas', tipo: 'm'},
  {id: 3, nombre: 'maderas', tipo: 'm2'},
  {id: 4, nombre: 'laminas', tipo: 'm2'},
  {id: 5, nombre: 'cocinas', tipo: 'u'},
  {id: 6, nombre: 'hornos', tipo: 'u'}
]

data.artecol.tipos = {
  "default": {
    props: {
      cantidad: 'Cantidad',
      alto: 'Alto',
      ancho: 'Ancho'
    }
  },
  m: {
    func: function (mat) {
      return mat.precio / mat.cantidad;
    },
    props: {
      cantidad: 'Metros',
      alto: false,
      ancho: false,
    }
  },
  m2: {
    func: function (mat) {
      return (mat.precio / mat.cantidad) / (mat.alto * mat.ancho);
    },
    props: {
      cantidad: true,
      alto: true,
      ancho: true,
    }
  },
  u: {
    func: function (mat) {
      return (mat.precio / mat.cantidad);
    },
    props: {
      cantidad: true
    }
  }
}