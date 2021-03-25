const express = require("express");
var ObjectId = require('mongoose').Types.ObjectId;
const path = require('path');
const bcrypt = require('bcryptjs');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const Tools = require('../public/ObjExport')
const BackValidate = require('../public/Back_Validate')
var _ = require('lodash');


var PdfPrinter = require('pdfmake');
var fs = require('fs');

const fonts = require("../fonts")
const styles = require('../styles')
//const {content} = require('../pdfContent')





//Shemas
const User = require('../schemas/Users')
const Conceptos = require('../schemas/Conceptos')
const Alumnos = require('../schemas/Alumnos')
//const Alumnos_Conceptos = require('../schemas/Alumnos_Conceptos')
const Alumnos_Conceptos3 = require('../schemas/Alumnos_Conceptos3')
const Materias = require('../schemas/Materias')
const Observaciones = require('../schemas/Observaciones')
const Grupos = require('../schemas/Grupos')
const { forEach, each } = require("lodash");

//Creo el obj router
const router = express.Router();



//Gral
router.get('/login', IsNotAuthenticated,function (req, res) {
  res.status(200).render('../views/login')
})//end get

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/home',
  failureRedirect: '/login',
  passReqToCallback: true
}))//end post

router.get("/logout", IsAuthenticated, function (req, res) {
  req.logOut();
  res.redirect('/login');
})//end get

router.get('/home',IsAuthenticated ,async function (req, res) {

  
  if(req.user.tipo == 'profe'){
    
      res.redirect('/profes')
  }
  if(req.user.tipo == 'alumno'){
    
    res.redirect('/alumnos')
}
  
})//end get



//Profes
router.get('/profes', IsAuthenticated ,async function (req, res) {
  //console.log(req.sessionID)
  res.status(200).render('../views/menu_profes',{})
})//end get

router.get('/alumnos', IsAuthenticated ,async function (req, res) {
  

  
  res.status(200).render('../views/alumnos',{user: req.user.show_name,
    sexo:req.user.sexo,tipo:req.user.tipo})
})//end get

router.get('/conceptos', IsAuthenticated ,async function(req,res){
  let usuario = req.user.id
 
  let result = await Alumnos_Conceptos2.where({user:ObjectId(usuario)})
  
  let dato = {data:result}
  res.status(200).json(dato)
})//end get

router.post('/alumnos', IsAuthenticated ,async function (req, res) {
  let data = []
  let idMateria = await Materias.where({materia:req.body.materia})
  let alumnos = await Alumnos.where({active:true,curso:req.body.curso})
  let alumnos_conceptos = await Alumnos_Conceptos3.where({curso:req.body.curso,
    id_materia:idMateria[0]._id})
  
  
  
  let arrDescontar = []
  let arrEnviar = []
  alumnos.forEach(e =>{
    //arrDescontar.push(e._id)
    alumnos_conceptos.forEach(f => {

      if(e._id.equals(f.id_alumno) && f.id_materia.equals(idMateria[0]._id)){
        
        data.push(e)
      }
    })//end for2
  })//end for
  
  
  let data3=[]
  _.each(alumnos,function(objeto) {

    var elemento_en_data2 = _.find(data,objeto);

    if(elemento_en_data2===undefined) {
      data3.push(objeto);
    }

  });

  arrEnviar = data3
  //console.log(data3)

  res.status(200).json(Tools.Obj.sortArrayOfObjectsByAnyField(arrEnviar,'last_name'))
})//end post

router.get('/cursosAsignados', IsAuthenticated ,async function(req,res){
  let cursos_asignados = await User.where({active:true, _id:ObjectId(req.user.id)})

  let arr = []
  cursos_asignados[0].cursos.forEach(e => {
    //if(e.curso === '5H' || e.curso === '5CN'){
    arr.push(e)
    //}
  })//end
  res.status(200).json(arr)
})//end get

router.post('/datosModal', IsAuthenticated ,async function(req, res){
  let arr = []
  let valoracion;
  let id = req.body.id
  let result = await Alumnos_Conceptos2.where({_id:ObjectId(id)})

  
  res.status(200).json(result)
})//end post

router.post('/agregar', IsAuthenticated ,async function (req, res) {
  if(typeof(req.body.alumno) !== 'string' || req.body.alumno == '' || req.body.alumno == null){
    res.status(401).end()
    return false
  }
  if(typeof(req.body.select1) !== 'string' || req.body.select1 == '' || req.body.select1 == null){
    res.status(401).end()
    return false
  }
  if(typeof(req.body.select2) !== 'string' || req.body.select2 == '' || req.body.select2 == null){
    res.status(401).end()
    return false
  }
  if(typeof(req.body.select3) !== 'string' || req.body.select3 == '' || req.body.select3 == null){
    res.status(401).end()
    return false
  }

  //Obtengo el usuario
  let usuario = req.user.id
  //Obtengo la materia
  let materia = req.body.materia
  //Obtengo el cuatrimestre
  let cuatrimestre = req.body.cuatrimestre
  //Obtengo id_materia
  let id_materia = req.body.id_materia

  //cuento el alumno que ingresa en la bd
  let cant_alumnos = await Alumnos_Conceptos2.where({id_alumno:ObjectId(req.body.alumno),
    user:ObjectId(usuario), id_materia:id_materia, cuatrimestre:cuatrimestre})

  //Obtengo los datos del alumno
  let dato_alumno = await Alumnos.where({active:true, _id:ObjectId(req.body.alumno)})


  //Obtengo el nombre del concepto
  let concepto1 = await Conceptos.where({active:true, _id:ObjectId(req.body.select1)})
  let concepto2 = await Conceptos.where({active:true, _id:ObjectId(req.body.select2)})
  let concepto3 = await Conceptos.where({active:true, _id:ObjectId(req.body.select3)})

  let obj = [
  {concepto1:req.body.select1, nombre:concepto1[0].concepto, positivo:concepto1[0].positivo, tipo:concepto1[0].tipo},
  {concepto2:req.body.select2, nombre:concepto2[0].concepto, positivo:concepto2[0].positivo, tipo:concepto2[0].tipo},
  {concepto3:req.body.select3, nombre:concepto3[0].concepto, positivo:concepto3[0].positivo, tipo:concepto3[0].tipo},
]


  if(cant_alumnos.length == 2){
      res.status(402).end()
  }//end if

  if(cant_alumnos.length == 0 || cant_alumnos.length == 1){

    let nuevo = await new Alumnos_Conceptos2()
    nuevo.id_alumno = ObjectId(req.body.alumno)
    nuevo.name = dato_alumno[0].name
    nuevo.last_name = dato_alumno[0].last_name
    nuevo.curso = dato_alumno[0].curso
    nuevo.cuatrimestre = cuatrimestre
    nuevo.user = ObjectId(usuario)
    nuevo.materia = materia
    nuevo.id_materia = ObjectId(id_materia)

    nuevo.conceptos = obj
    nuevo.save(function(err){
      if (err) throw err;
      res.status(200).end()
    })
  }




})//end post

router.delete('/delete', IsAuthenticated ,async function(req, res){
  if(typeof(req.body.id) !== 'string' || req.body.id == '' || req.body.id == null){
    res.status(401).end()
    return false
  }
  await Alumnos_Conceptos2.deleteOne({_id:ObjectId(req.body.id)})
  console.log('Se eliminó correctamente...')
  res.status(200).end()
})//end delete

router.get('/estadisticas', IsAuthenticated ,function(req,res){

  res.status(200).render('../views/estadisticas',{user: req.user.show_name,
    sexo:req.user.sexo ,tipo:req.user.tipo})
})//end

router.get('/estadisticasprofes', IsAuthenticated ,async function(req,res){
  var arr = []
  let cursos_asignados = await User.where({active:true, _id:ObjectId(req.user.id)})
  let conceptos = await Alumnos_Conceptos2.where({})
  let alumnos = await Alumnos.where({active:true})

  let arr2 = []
  cursos_asignados[0].cursos.forEach(e => {
    //if(e.curso === '5H' || e.curso === '5CN'){
      arr2.push(e)
    //}
  })//end


  
  arr2.forEach(e => {
    
    let total_materia = Number(ExtraerCantAlumnosSegunCursoYMateria(conceptos, e.curso, e.id_materia))

    let total = Number(ExtrarCantAlumnosSegunCurso(alumnos, e.curso))

    if(total_materia === 'NaN'){
      total_materia = 0
    }
    if(total === 'NaN'){
      total = 0
    }

    let porcentaje = Math.round((total_materia * 100)/ total) + '%'
    arr.push({name: e.curso +' '+e.materia, porcentaje:porcentaje})
  })//end for

 
  res.status(200).json(arr)
})//end get
//nuevo
router.post('/calificar', IsAuthenticated,async (req, res) => {
  if(typeof(req.body.id_alumno) !== 'string' || req.body.id_alumno == '' || req.body.id_alumno == null){
    res.status(401).end()
    return false
  }
  
  //let materias = await Materias.where({materia:req.body.id_materia})
  //console.log(materias)
  global.id = req.body.id_alumno
  global.materia = req.body.materia
  global.id_materia = req.body.id_materia
  
  res.status(200).end()
})//end

router.post('/calificar2', IsAuthenticated,async (req, res) => {
  if(typeof(req.body.id_alumno) !== 'string' || req.body.id_alumno == '' || req.body.id_alumno == null){
    res.status(401).end()
    return false
  }
  
  let materias = await Materias.where({_id:ObjectId(req.body.id_materia)})
  global.id = req.body.id_alumno
  global.materia = materias[0].materia
  global.id_materia = materias[0]._id
  
  res.status(200).end()
})//end

router.get('/cargarConcepto', IsAuthenticated,async (req, res) => {

  let result = await Alumnos.where({active:true, _id:ObjectId(global.id)})

  res.status(200).render('../views/calificar_Concepto',{user: req.user.show_name, sexo:req.user.sexo,tipo:req.user.tipo, result, materia:global.materia, id_materia:global.id_materia})
})//end

router.get('/cargarNota', IsAuthenticated,async (req, res) => {
 
  let result = await Alumnos.where({active:true, _id:ObjectId(global.id)})

  res.status(200).render('../views/calificar_Nota',{user: req.user.show_name, sexo:req.user.sexo,tipo:req.user.tipo, result, materia:global.materia, id_materia:global.id_materia})
})//end

router.post('/prosesar', IsAuthenticated,async (req, res) => {
  if(typeof(req.body.obj) === null){
    res.status(401).end()
    return false
  }

  //Compruevo que no este repetido.
  let alumno = await Alumnos_Conceptos3.where({id_alumno:req.body.obj.id_alumno, 
    id_materia:req.body.obj.id_materia, curso:req.body.obj.curso})

  if(alumno.length !== 0){
    res.status(401).end()
    return false
  }
  
  let obj = {
  id_criterio: req.body.obj.id_criterio,
  id_alumno : ObjectId(req.body.obj.id_alumno),
  last_name : req.body.obj.last_name,
  curso : req.body.obj.curso,
  materia : req.body.obj.materia,
  id_materia : ObjectId(req.body.obj.id_materia),
  value : '',
  nota:req.body.obj.nota
  }

  let data = await new Alumnos_Conceptos3(obj)
  data.save()

  res.status(200).end()
})//end

router.post('/showpage' ,async function (req, res) {
  global.curso = req.body.curso
  global.materia = req.body.materia
  global.id_materia = req.body.id_materia
  console.log(req.body)
  res.status(200).end()
})//endshowconcept

router.get('/showpagecriterio' ,async function (req, res) {
  res.status(200).render('../views/criterios',{user: req.user.show_name, 
    sexo:req.user.sexo,tipo:req.user.tipo, materia:global.materia,curso:global.curso})
})//end get

router.get('/getstudents',async (req,res) => {
  //let alumnos = await Alumnos.where({active:true,curso:global.curso})
  //res.status(200).json(alumnos)
  let data = []
  let idMateria = await Materias.where({materia:global.materia})
  let alumnos = await Alumnos.where({active:true,curso:global.curso})
  let alumnos_conceptos = await Alumnos_Conceptos3.where({curso:global.curso,
    id_materia:idMateria[0]._id})
  
  
  
  let arrDescontar = []
  let arrEnviar = []
  alumnos.forEach(e =>{
    alumnos_conceptos.forEach(f => {

      if(e._id.equals(f.id_alumno) && f.id_materia.equals(idMateria[0]._id)){
        
        data.push(e)
      }
      if(f.id_criterio == 'nota'){
        
        data.push(e)
      }
      /*if(e._id.equals(f.id_alumno) && f.id_materia.equals(idMateria[0]._id) && f.id_criterio == 'nota'){
        
        data.push(e)
      }*/
    })//end for2
  })//end for
  
  
  let data3=[]
  _.each(alumnos,function(objeto) {

    var elemento_en_data2 = _.find(data,objeto);

    if(elemento_en_data2===undefined) {
      data3.push(objeto);
    }

  });

  arrEnviar = data3
  //console.log(data3)

  res.status(200).json(Tools.Obj.sortArrayOfObjectsByAnyField(arrEnviar,'last_name'))

  
})

router.get('/shownote' ,async function (req, res) {
  res.status(200).render('../views/notas',{user: req.user.show_name, 
    sexo:req.user.sexo,tipo:req.user.tipo, materia:global.materia,curso:global.curso})
})//end get

router.get('/showcriterio' ,async function (req, res) {
  res.status(200).render('../views/calificar_concepto2',{user: req.user.show_name, 
    sexo:req.user.sexo,tipo:req.user.tipo, materia:global.materia,curso:global.curso})
})//end get

router.post('/addcriterios' ,async function (req, res) {
  let materias = await Materias.where({})
  let alumnos = await Alumnos.where({active:true})
  let criterios = await Alumnos_Conceptos3.where({})
  let arr = req.body.arr        
  /*let id_alumno = req.body.id_alumno                     
  let  curso = req.body.curso              
  let  id_materia = req.body.id_materia         
  let  nota = req.body.nota               
  let  value = req.body.value*/
  
  arr.forEach(async e => {
    if(e.id_criterio != '' && e.id_alumno != ''){

      let data_duplicate = await DataDuplicate(criterios,e.id_criterio,e.id_alumno,e.curso)

      if(data_duplicate){
        console.log('Dato duplicado...')
        res.status(200).end()
        return false
      }

      let alumno = await ExtraerLastNameSegunId(alumnos,e.id_alumno)
      let materia =await ExtraerMateriasSegunId(materias,e.id_materia)
      
      var data =await  new Alumnos_Conceptos3()
      data.id_criterio = ObjectId(e.id_criterio)
      data.id_alumno = ObjectId(e.id_alumno)
      data.last_name = alumno
      data.curso = e.curso
      data.id_materia = ObjectId(e.id_materia)
      data.materia = materia
      data.nota = e.nota
      data.value = e.value
      await data.save()

    }//end if
  })//end
  
  res.status(200).end()
})//end

router.get('/getcriterios' ,async function (req, res) {
  let cursos_asignados = await User.where({active:true, _id:ObjectId(req.user.id)})
  let alumnos = await Alumnos.where({active:true})
  let criterios = await Alumnos_Conceptos3.where({})

  let arr = []
  cursos_asignados[0].cursos.forEach(e => {
    arr.push(e)
  })//end

  let c = 0
  let c2 = 0
  let arr2 = []
  arr.forEach(e => {
    arr2.push({
      id:e.id_materia,
      materia:e.materia,
      curso:e.curso,
      status:Status(alumnos,e.curso,criterios,e.id_materia)
    })
  })
  res.status(200).json(arr2)
})//end get




//Preceptores
router.get('/botones', IsAuthenticated ,async function(req,res){
  let cursos_asignados = await User.where({active:true, _id:ObjectId(req.body.id)})
  let arr = cursos_asignados[0].cursos.sort(function (a, b) {

    if(a.name >  b.name){
        return 1
    }
    if(a.name <  b.name){
        return -1
    }
    return 0
  })

  res.status(200).json(arr)
})//end get

router.get('/preceptores', IsAuthenticated ,async function(req,res){
  let arrEnviar = []
  res.status(200).render('../views/menu_preceptores',{arrEnviar,user: req.user.show_name, sexo:req.user.sexo, tipo:req.user.tipo})
})//end get

router.get('/cursosAsignadosPreceptores', IsAuthenticated ,async function(req,res){

  let cursos_asignados_preceptores = await User.where({active:true, _id:ObjectId(req.user.id)})
  
  let arr = []
  cursos_asignados_preceptores[0].cursos.forEach(e => {
    //if(e.curso === '5H' || e.curso === '5CN'){
      arr.push(e)
    //}
  })//end
  res.status(200).json(arr)

})//end get

router.post('/alumnos_preceptor', IsAuthenticated ,async function (req, res) {
  let data = []
  //console.log(req.body.curso)
  let alumnos = await Alumnos.where({active:true,curso:req.body.curso})

  let arrEnviar = []
  alumnos.forEach(e =>{
    arrEnviar.push({id:e._id, last_name:e.last_name, name:e.name})
  })//end for

  let data3=[]
  _.each(alumnos,function(objeto) {

    var elemento_en_data2 = _.find(data,objeto);

    if(elemento_en_data2===undefined) {
      data3.push(objeto);
    }

  });

  arrEnviar = data3

  res.status(200).json(arrEnviar)
})//end post

router.post('/alumnos2', IsAuthenticated,async function(req, res){
  let curso = req.body.curso
  
  let alumnos = await Alumnos.where({active:true, curso:curso}).sort({last_name:1})
  
  res.status(200).json(alumnos)
})//end

router.post('/consultar', IsAuthenticated ,async function(req,res){
  let id_alumno = req.body.id_alumno.trim()
  let curso = req.body.curso.trim()
  let obj = {}
  let arr_de_id_materia = []
  let arr = []
  
  let conceptos = await Alumnos_Conceptos2.where({id_alumno:ObjectId(id_alumno), curso:curso})
  
 
  let materias_por_curso = await Materias.where({cursos:curso})
  

  materias_por_curso.forEach(e => {
    obj = {
      id_materia:e._id,
      materia:e.materia,
      concepto:false
    }
    arr.push(obj)
  })//end 


  arr.forEach(e => {

    conceptos.forEach(f => {
      if(e.id_materia.equals(f.id_materia)){
        e.concepto = true
      }


    })//end
  })//end


  //console.log(arr)
  res.status(200).json(arr)
})//end


//Psicopedagoga
router.get('/psicopedagoga', IsAuthenticated ,async function (req, res) {

  res.status(200).render('../views/menu_psico',{user: req.user.show_name, sexo:req.user.sexo,tipo:req.user.tipo})
})//end get

router.post('/estadisticaspsico', IsAuthenticated ,async function(req,res){
  let arr = []
  //let cuatrimestre = req.body.cuatrimestre
  let materias = await Materias.where({})
  let conceptos = await Alumnos_Conceptos2.where({})
  let alumnos = await Alumnos.where({})

  let arr2 = []
  conceptos.forEach(e => {
    //if(e.curso === '5H' || e.curso === '5CN'){
      arr2.push(e)
    //}
  })//end

  //console.log(arr2)
  materias.forEach(e => {
    //console.log(e)
  arr2.forEach(f => {

      total_materia = Number(ExtraerCantAlumnosSegunCursoYMateria(arr2, String(f.curso), e._id))

      let total = Number(ExtrarCantAlumnosSegunCurso(alumnos, String(f.curso)))

      let porcentaje = Math.round((total_materia * 100)/ total) + '%'
      arr.push({name: String(f.curso) +' '+e.materia, porcentaje:porcentaje})
    })//end for
  })//end for

  res.status(200).json(arr)
})//end get

router.get('/estadisticaspsicopagina', IsAuthenticated ,function(req,res){

  res.status(200).render('../views/estadisticas2',{user: req.user.show_name,
    sexo:req.user.sexo ,tipo:req.user.tipo})
})//end

router.get('/conceptospsico', IsAuthenticated ,async function (req, res) {

  res.status(200).render('../views/conceptos',{user: req.user.show_name, sexo:req.user.sexo,tipo:req.user.tipo})
})//end get

router.get('/api-conceptos', IsAuthenticated ,async function (req, res) {
  let arr = []
  let valoracion_ = ''
  let conceptos = await Conceptos.where({active:true})

  conceptos.forEach(e => {
    if(e.positivo === true){
      valoracion_ = 'Positiva'
    }else{
      valoracion_ = 'Negativa'
    }
    arr.push({id:e._id, tipo:e.tipo, concepto:e.concepto, valoracion:valoracion_})
  })//end

  let dato = {data:arr}
  res.status(200).json(dato)
})//end get

router.post('/addconcept', IsAuthenticated ,async function(req,res){
  let concepto = req.body.concepto
  let tipo = req.body.tipo
  let positivo = req.body.positivo

  if(positivo === 'Positiva'){
    positivo = true
  }
  if(positivo === 'Negativa'){
    positivo = false
  }

  let result = await Conceptos.where({active:true, tipo:tipo, concepto:concepto, positivo:positivo})

  if(result.length !== 0){
    res.status(401).end()
    return false
  }

  let dato = new Conceptos()
  dato.concepto = concepto
  dato.tipo = tipo
  dato.positivo = positivo
  dato.save(function(err){
    if (err) throw err;
    res.status(200).end()
  })
})//end

router.delete('/deleteConcept', IsAuthenticated ,async function(req,res){
  if(typeof(req.body.id) !== 'string' || req.body.id == '' || req.body.id == null){
    res.status(401).end()
    return false
  }

  let id = req.body.id
  await Conceptos.deleteOne({_id:ObjectId(id)})
  console.log('Se eliminó correctamente...')
  res.status(200).end()
})//end

router.post('/searchConcept', IsAuthenticated,async function(req, res){
  let valoracion;
  let id = req.body.id

  let result = await Conceptos.where({active:true, _id:ObjectId(id)})
  if(result[0].positivo === true){
    valoracion = 'Positiva'
  }else{
    valoracion = 'Negativa'
  }
  let obj = {
    tipo:result[0].tipo,
    positivo:valoracion,
    concepto:result[0].concepto,
  }
  res.status(200).json(obj)
})//end

router.post('/updateConcept', IsAuthenticated ,async function(req,res){
  if(typeof(req.body.id) !== 'string' || req.body.id == '' || req.body.id == null){
    res.status(401).end()
    return false
  }

  if(req.body.positivo === 'Positiva'){
    positivo = true
  }
  if(req.body.positivo === 'Negativa'){
    positivo = false
  }

  let t = await Conceptos.findByIdAndUpdate(ObjectId(req.body.id),{tipo:req.body.tipo,
  positivo:positivo, concepto:req.body.concepto})
  res.status(200).end()
})//end

router.get('/grupos', IsAuthenticated ,async function(req,res){
  let grupos =await Grupos.where({})


  res.status(200).json(grupos)
})//end

router.get('/observaciones', IsAuthenticated ,function(req,res){
  res.status(200).render('../views/observaciones',{user: req.user.show_name,
    sexo:req.user.sexo,tipo:req.user.tipo})
})//end

router.get('/api-alumnos', IsAuthenticated,async function(req,res){
  let obj = {}
  let arr = []
  let result = await Alumnos.where({active:true})
  let obs = await Observaciones.where({})

  let arr2 = []
  result.forEach(e => {
    if(e.curso === '5H' || e.curso === '5CN'){
      arr2.push(e)
    }
  })//end


  
  arr2.forEach(e => {
    obj={
      id_obs: '',
      id_alumno:e._id,
      last_name:e.last_name,
      name:e.name,
      curso:e.curso,
      obs:false
    }
    arr.push(obj)
  })//

  arr.forEach(e => {
    obs.forEach(f => {
      
      if(e.id_alumno.equals(f.id_alumno)){
        e.id_obs = f._id
       e.obs = true
      }
    })//
  })//end

  
  //console.log(arr)
  res.status(200).json(arr)
})//end

router.post('/addComment', IsAuthenticated ,async function(req,res){
  let id = req.body.id
  let comentario = req.body.comentario
  let cuatrimestre = req.body.cuatrimestre

  //Controla que no haya duplicado
  let result = await Observaciones.where({id_alumno:ObjectId(id)})
  if(result.length !== 0){
    res.status(401).end()
    return false
  }

  let data = new Observaciones()
  data.id_alumno = ObjectId(id)
  data.observacion = comentario
  data.cuatrimestre = cuatrimestre
  data.save(function(err){
    if (err) throw err;
    res.status(200).end()
  })
})//end

router.post('/addObs', IsAuthenticated ,async function(req,res){
  let apellido = req.body.apellido
  let comentario = req.body.comentario
  let nombre = req.body.nombre
  let curso = req.body.curso

  let datos = await Alumnos.where({active:true, last_name:apellido.trim(), 
    name:nombre.trim(), curso:curso.trim()})
  
  //Controla que no haya duplicado
  let result = await Observaciones.where({id_alumno:ObjectId(datos[0]._id)})
  if(result.length !== 0){
    res.status(401).end()
    return false
  }

  let data = new Observaciones()
  data.id_alumno = ObjectId(datos[0]._id)
  data.observacion = comentario
  data.save(function(err){
    if (err) throw err;
    res.status(200).end()
  })
})//end

router.delete('/deleteobs',IsAuthenticated, async (req, res) =>{
  
  let id = req.body.id
  await Observaciones.deleteOne({_id:ObjectId(id)})
  console.log('Se eliminó correctamente...')
  res.status(200).end()
})//end

router.post('/getObs',IsAuthenticated,async (req,res) => {
  let id = req.body.id
  let obs = await Observaciones.where({_id: ObjectId(id)})

  res.status(200).json(obs)
})//end

router.put('/editObs',IsAuthenticated,async (req,res) => {
  let id = req.body.id
  let coment = req.body.comentario
 
  await Observaciones.updateOne({_id:ObjectId(id)},{$set: {observacion:coment}})
  //console.log(y)
  res.status(200).end()
})//end

router.get('/infoalumnos', async (req, res) => {
  res.status(200).render('../views/infoAlumnos',{user: req.user.show_name, sexo:req.user.sexo,tipo:req.user.tipo})
})//end

router.get('/getAlumnos', async (req, res) => {
  let result = await Alumnos.where({active:true})
  let materias = await Materias.where({})
  let arr = []

  let materias_del_curso = ExtraerMateriasSegunCurso(materias, result[0].curso)
  
  result.forEach(e => {
   
    materias_del_curso.forEach(f =>{
      obj = {
        id:e._id,
        last_name:e.last_name,
        name:e.name,
        dni:e.dni,
        curso:e.curso,
        materia:f
      }
      arr.push(obj)
    })//end
  })//end
  
  
  let dato = {data:arr}
  res.status(200).json(dato)
})//end

router.post('/getObs2',IsAuthenticated,async (req,res) => {
  let id_alumno = req.body.id
  let materia = req.body.materia
  let data;
  let arr = []

  let id_materia = await Materias.where({materia:materia})
  let obs = await Alumnos_Conceptos2.where({id_alumno: ObjectId(id_alumno), id_materia:ObjectId(id_materia[0]._id)}) 

  if(obs.length === 0){
    obs = [{nota:'Sin Datos'}]
  }

  res.status(200).json(obs)
})//end





//Pdf
router.post('/descarga', IsAuthenticated ,async function(req, res){
  let id_alumno = req.body.id_alumno
  let id_materia = req.body.id_materia


  //Obtengo datos del alumno
  let datos_alumno = await Alumnos.where({_id:ObjectId(id_alumno)})
  //Obtengo los conceptos del alumno
  let conceptos_guardados = await Alumnos_Conceptos2.where({id_alumno:ObjectId(id_alumno), id_materia:ObjectId(id_materia)})
  //Obtengo la observacion
  let obs = await Observaciones.where({id_alumno:ObjectId(id_alumno)})
  //Obtengo el dni para enviar
  let dni = datos_alumno[0].dni
  console.log(datos_alumno[0].dni)
  res.status(200).json({status:true, datos_alumno, conceptos_guardados, obs, dni})
})//end get
























router.get('/cargarUsuario', async  (req, res) => {
  let user = await new User()
  user.username = 'natalia'
  user.password = bcrypt.hashSync('123', 10)
  user.show_name = 'Holm Natalia'
  user.sexo = 'f'
  user.tipo = 'alumno'
  user.active = true;
  user.cursos.push(
  /*{curso:'4H', materia:''},
  {curso:'4CN', materia:''},
  {curso:'3CN', materia:'Biblia'},
  {curso:'2A', materia:'Inglés'},
  {curso:'1A', materia:'Inglés'},
  {curso:'2B', materia:'Inglés'},
  {curso:'1B', materia:'Inglés'},
  {curso:'5H', materia:'Inglés'},
  {curso:'4H', materia:'Inglés'},
  {curso:'4CN', materia:'Inglés'},
  {curso:'2A', materia:'Fisico-Quimica'},
  {curso:'4H', materia:'Quimica'}*/
  )
  user.save()
  res.send('ok')

  //await User.updateOne({active:true, _id:ObjectId('5f3a7d89a3586b0e5438c594')},{$push: {cursos: {curso:'3A'}} })
})//end get

























//Functions
function IsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

function IsNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/home");
  }
}

function queCuatrimestreEs(){
  let mes = new Date()
  if((mes.getMonth() + 1) <= 7){
    return '1'
  }
  if((mes.getMonth() + 1) >= 8){
    return '2'
  }
}

function fecha(){
  let f = new Date();
  return(f.getDate() + "-"+ f.getMonth()+ "-" +f.getFullYear());
}


function DataDuplicate(criterios,idCriterio,idAlumno,curso){
  let result = false 
  criterios.forEach(e => {
    
    if(e.id_criterio.equals(idCriterio) && e.id_alumno.equals(idAlumno)  && e.curso === curso){
      result = true
    }
  })//end
  return result
}

function ExtraerMateriasSegunId(materias,id){
  let result;
  materias.forEach(e => {
    if(e._id.equals(ObjectId(id))){
      result = e.materia
    }
  })//end
  return result
}//end

function ExtraerLastNameSegunId(alumnos,id){
  let result;
  alumnos.forEach(e => {
    if(e._id.equals(ObjectId(id))){
      result = e.last_name
    }
  })//end
  return result
}//end

function ExtraerMateriasSegunCurso(array_materias, curso){
  let arr = []
  array_materias.forEach(e => {
    if(e.cursos.includes(curso)){
      arr.push(e.materia)
    }
  })//end
  return arr
}//end

function ExtraerCantAlumnosSegunCursoYMateria(array_cursos, curso_, idMateria){
  //let cuatrimestre = cuatrimestre_
  let id_materia = idMateria
  let curso = curso_
  let c = 0

  array_cursos.forEach( e => {

    if(e.curso === curso && String(e.id_materia) === String(id_materia)){
      c++
    }

  })//end for

  return c
}//end funcion

function ExtrarCantAlumnosSegunCurso(array_alumnos, curso_){
//let cuatrimestre = cuatrimestre_
let curso = curso_
let c = 0

array_alumnos.forEach( e => {

  if(e.curso === curso){
    c++
  }
})//end for
return c
}//end funcion

function ExtraerCantCriteriosSegunCursoyMateria(criterios,curso,idMateria){
  let c=0
  criterios.forEach(e => {
    if(e.id_materia.equals(idMateria) && e.curso == curso){
      c++
    }
  })
  return c
}//end

function Status(alumnos,curso,criterios,idMateria){
  let c = ExtrarCantAlumnosSegunCurso(alumnos,curso)
  let c2 = ExtraerCantCriteriosSegunCursoyMateria(criterios,curso,idMateria)
  
  if((c * 4)  === c2){
    return 'Completo'
  }else{
    return 'Incompleto'
  }
}//end

function UbicarEnY(total,porcentaje){
  return Math.round((porcentaje * total)/100)
}//end

//Exporto las rutas
module.exports = router;
