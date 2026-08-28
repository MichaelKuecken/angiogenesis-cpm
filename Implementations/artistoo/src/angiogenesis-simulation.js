let CPM = require("./artistoo-cjs.js")
const fs = require("fs")
const args = require('minimist')(process.argv.slice(2));
const { ChemotaxisConstraintCI, CustomGrid, Adhesion2 } = require("./custom-classes.js")


function getInput( name, defaultValue, type = undefined ){
	
	if( !args.hasOwnProperty(name)) return defaultValue
	if( type === "boolean" ){ return true }
	else if( type === "int" ){
		if( args[name][0] == "m" ){
			return -parseInt(args[name].substring(1) )
		}
		return parseInt( args[name] ) 
	} 
	else if (type === "float" ){ return parseFloat( args[name] ) } 
	else { return args[name] }
}

const seed = getInput( "x", 1, "int" )
const T = getInput( "T", 5, "int" )
const Jcm = getInput( "j", 4, "int" )
const Jcc = getInput( "J", 1, "int" )
const D = getInput( "D", 1.0, "float" )
const a = getInput( "a", 0.3, "float" )
const e = getInput( "e", 0.3, "float" )
const s = getInput( "s", 0.1, "float" )
const mu = getInput( "m", 500, "int" )
const Nd = getInput( "N", 10, "int" ) // number of diffusion substeps per MCS
const mode = getInput( "c", "Sync", "string" ) 
	// mode can be "Orig" (original simulation), "CC3D" (mimic cc3d operators splitting),
	// "Sync" (diffusion/decay/secretion all simultanaeous), or "Morpheus" (mimic original Morpheus)
const drawGradient = getInput( "g", false, "boolean" )
const imgpath = getInput( "i", "output/img", "string" )

const saveImg = true

let expName = "angiogenesis" + mode + "-Temp" + T + "-Jcm" + Jcm + "-Jcc" + Jcc + "-D" + D + "-prod" + a + "-decay" + e + "-sat" + s + "-lchem" + mu + "-seed" + seed

fs.mkdirSync(imgpath, { recursive: true })
//console.log(imgpath + "/" + expName )


let fieldsize = [200,200] 	// 140,140
let Ncell = 400		// 200

let config = {

	field_size : fieldsize,
	
	// CPM parameters and configuration
	conf : {
		torus : [true,true],						
		seed : seed,							
		T : T,
		D : D, // 0.75,	// diffusion coefficient in pix^2 / MCS
		Nd : Nd, // execute diffusion in Nd steps/MCS
		alpha : a, // 0.3, // secretion rate per MCS
		epsilon : e, // 0.3, // decay rate per MCS
		J2: [[0,Jcm], [Jcm,Jcc]],
		LAMBDA_V : [0,5],					
		V : [0,50],
		NbhOrder : { sampling: 1, adhesion: 4 }			
	},
	simsettings : {
	
		NRCELLS : [Ncell],		
		INNERFIELD : fieldsize,			
		RUNTIME : 501,
		
		BURNIN : 0,
		CELLCOLOR : ["000000"],
		SAVEIMG : saveImg,
		IMGFRAMERATE : 500,
		SAVEPATH: imgpath,
		EXPNAME : expName,
		zoom : 1,
		STATSOUT : { browser: false, node: false }

	}
}

let chem_config = {
		LAMBDA_CH: [0,mu],
		X : 0,
		s : s,
		retract : true,
		CH_FIELD : {} // will be defined below
}

//console.log( config ) 
//console.log( chem_config )

let sim


function initializeGrid(){} // overwrite to do nothing until we replace with custom grid
function seedCells(){
	
	this.addGridManipulator()	
	const delta = Math.floor( Math.sqrt( this.conf.NRCELLS[0]))
	const dx = [ Math.floor( this.conf.INNERFIELD[0]  / delta ), Math.floor( this.conf.INNERFIELD[1]  / delta ) ]
	const offset = [ Math.floor( dx[0] / 2 ), Math.floor( dx[1] /2) ]
	const buffer = Math.floor( (this.C.extents[0] - this.conf.INNERFIELD[0])/2)

	for( let i = 0; i < delta; i++ ){
		for( let j = 0; j < delta; j++ ){
			const xx = offset[0] + i*dx[0] + buffer
			const yy = offset[1] + j*dx[1] + buffer
			this.gm.seedCellAt( 1, [xx,yy])
		}
	}

}

// called by postMCSListener after every MCS
function updateChemokine( D, alpha, epsilon ){

	switch(mode) {
	  case "Orig": {
	  
		// originally, this implementation did diffusion, then secretion/decay.
		this.chemokine.diffusion( D ) 
        let update = this.chemokine._pixels.map( (x,i) => {
                const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
                return x + ( alpha * p ) - ( epsilon * x * (1 - p) )
        })
        this.chemokine._pixels = update 
		break;
	  }
	  case "CC3D": {
		// cc3d does diffusion and decay at the same time first:
		let update2 = this.chemokine._pixels.map( (x,i) => {
			
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return x - ( epsilon * x * (1 - p) ) + D * this.chemokine.laplaciani( i )
			//return x - ( epsilon * x ) + D * this.chemokine.laplaciani( i )
		})
		this.chemokine._pixels = update2
		
		// then it does secretion:
		let update = this.chemokine._pixels.map( (x,i) => {
			
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return  x + ( alpha * p )
		})
		this.chemokine._pixels = update	
		break;
		}
	  case "Sync": {
	  	// new default is cleaner; all operations are performed simultaneously on cached grid.
	  	let update = this.chemokine._pixels.map( (x,i) => {
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return x + ( alpha * p ) - ( epsilon * x * (1 - p) ) + D * this.chemokine.laplaciani( i )
																					
		})
		this.chemokine._pixels = update	
		break;
		}
	  case "Morpheus":	{
		// original morpheus implementation does secretion+decay, then diffusion.
        let update = this.chemokine._pixels.map( (x,i) => {
                const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
                return x + ( alpha * p ) - ( epsilon * x * (1 - p) )
        })
        this.chemokine._pixels = update 
		this.chemokine.diffusion( D ) 
		break;
	  }
	  default:
		throw( `Unknown mode : ${mode} ; choose Orig, Sync, CC3D, or Morpheus.`)
	}

	
	
	
}

// called after every MCS
function postMCSListener(){

	// chemokine dynamics at Nd steps per MCS
	const Nd = this.C.conf.Nd
	const effectiveDiffusionRate = this.C.conf["D"] / Nd
	const effectiveAlpha = this.C.conf.alpha / Nd
	const effectiveEpsilon = this.C.conf.epsilon / Nd
	for( let i = 0 ; i < Nd ; i ++ ){
		this.updateChemokine( effectiveDiffusionRate, effectiveAlpha, effectiveEpsilon )	
	}
	
}

function drawCanvas(){

	if( !this.helpClasses["canvas"] ){ this.addCanvas() }
	
	
	this.Cim.clear("ffffff")
	
	if( drawGradient ){
		this.Cim.drawField( this.chemokine )
	}
	
	this.Cim.drawCells( 1, "00aa00")	
	//this.Cim.drawCellBorders( -1, "000000")	
	
}





sim = new CPM.Simulation( config, {
	seedCells : seedCells,
	initializeGrid : initializeGrid,	// these functions are defined below
	postMCSListener : postMCSListener,
	updateChemokine : updateChemokine,
	drawCanvas : drawCanvas
} )

// overwrite the default grid with one with custom neighborhood functions
sim.C.grid = new CustomGrid( config.field_size, config.conf.torus, config.conf.NbhOrder.sampling )
sim.C.midpoint = sim.C.grid.midpoint
sim.C.field_size = sim.C.grid.field_size
sim.C.pixels = sim.C.grid.pixels.bind(sim.C.grid)
sim.C.pixti = sim.C.grid.pixti.bind(sim.C.grid)
sim.C.neighi = sim.C.grid.neighi.bind(sim.C.grid)
sim.C.extents = sim.C.grid.extents

sim.C.add( new Adhesion2( {J2 : config.conf.J2, order : config.conf.NbhOrder.adhesion }  ))
//sim.C.add( new CPM.ConnectivityConstraint( {CONNECTED: [true, true ]} ) )
	
sim.chemokine = new CPM.Grid2D([sim.C.extents[0],sim.C.extents[1]], config.torus, "Float32")
chem_config.CH_FIELD = sim.chemokine
sim.C.add( new ChemotaxisConstraintCI( chem_config 	) )


sim.seedCells()


sim.run()
