const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const alumnos_conceptos2_schema = Schema({
    id_alumno:         {type:Object,   requerid:true},
    alumno:            {type:String,   requerid:true},
    curso:             {type:String,   requerid:true},
    materia:           {type:String,   requerid:true},
    id_materia:        {type:Object,   requerid:true},
    user:              {type:Object,   requerid:true},
    cl1: {type:String,   requerid:true},
    cl2: {type:String,   requerid:true},
    cl3: {type:String,   requerid:true},
    cl4: {type:String,   requerid:true},
    pdtoye1: {type:String,   requerid:true},
    pdtoye2: {type:String,   requerid:true},
    pdtoye3: {type:String,   requerid:true},
    pdtoye4: {type:String,   requerid:true},
    rdp1: {type:String,   requerid:true},
    rdp2: {type:String,   requerid:true},
    rdp3: {type:String,   requerid:true},
    rdp4: {type:String,   requerid:true},
    rdp5: {type:String,   requerid:true},
    pc1: {type:String,   requerid:true},
    pc2: {type:String,   requerid:true},
    pc3: {type:String,   requerid:true},
    pc4: {type:String,   requerid:true},
    hs1: {type:String,   requerid:true},
    hs2: {type:String,   requerid:true},
    hs3: {type:String,   requerid:true},
    hs4: {type:String,   requerid:true},
    nota: {type:String,   requerid:true, default:''},
})

//Exporto modelo
module.exports = mongoose.model('alumnos_conceptos2',alumnos_conceptos2_schema);