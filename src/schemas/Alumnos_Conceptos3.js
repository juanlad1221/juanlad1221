const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const alumnos_conceptos3_schema = Schema({
    id_criterio:        {type:Object,   requerid:true},
    id_alumno:          {type:Object,   requerid:true},
    last_name:             {type:String,   requerid:true},
    curso:              {type:String,   requerid:true},
    id_materia:         {type:Object,   requerid:true},
    materia:               {type:String,   requerid:true},
    nota:               {type:String,   requerid:true},
    value:              {type:String,   requerid:true},
})

//Exporto modelo
module.exports = mongoose.model('alumnos_conceptos3',alumnos_conceptos3_schema);