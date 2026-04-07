let CPM = require("./artistoo-cjs.js")
const fs = require("fs")
const args = require('minimist')(process.argv.slice(2));


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

const D = getInput( "D", 1.0, "float" )
const a = getInput( "a", 0.3, "float" )
const e = getInput( "e", 0.3, "float" )
const f = getInput( "f", 1, "int" ) // the scaling factor: describe the same space in fx as many pixels, so with higher spatial res.



let fieldsize = [200*f,200*f] 

let config = {

	field_size : fieldsize,
	
	// CPM parameters and configuration
	conf : {
		torus : [true,true],						
		D : D*f*f, // 0.75,	// diffusion coefficient in pix^2 / MCS
		Nd : 10*f*f, // execute diffusion in Nd steps/MCS
		alpha : a*f*f, // 0.3, // secretion rate per MCS
		epsilon : e // 0.3, // decay rate per MCS	
	},
	simsettings : {
	
		NRCELLS : [0],		
		INNERFIELD : fieldsize,			
		RUNTIME : 501,
		
		BURNIN : 0,
		STATSOUT : { browser: false, node: true } //{ browser: false, node: false }
	}
}

let sim

// called by postMCSListener after every MCS
function updateChemokine( D, alpha, epsilon ){
	
	// compucell does secretion first:
	let update = this.chemokine._pixels.map( (x,i) => {
		
		const midi = this.C.grid.p2i( [100*f,100*f] )
		const p = ( i == midi ) ? 1 : 0
		return  x + ( alpha * p )
	})
	this.chemokine._pixels = update	

	// then it does diffusion and decay at the same time:

	let update2 = this.chemokine._pixels.map( (x,i) => {
		
		const midi = this.C.grid.p2i( [100*f,100*f] )
		const p = ( i == midi ) ? 1 : 0
		//return x - ( epsilon * x * (1 - p) ) + D * this.chemokine.laplaciani( i )
		return x - ( epsilon * x ) + D * this.chemokine.laplaciani( i )
	})
	this.chemokine._pixels = update2

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
function logStats(){
	
	let tt = this.time + 1

	if( tt % 10 == 0 ){
		let conc = this.chemokine.pixti( this.C.grid.p2i( [80*f,80*f]) ) 
		
		const mass = this.chemokine._pixels.reduce(function(s,v) { return s + ( v || 0 ); }, 0)
		console.log( tt + "," + conc + "," + mass )

	}
				
}



sim = new CPM.Simulation( config, {
	postMCSListener : postMCSListener,
	updateChemokine : updateChemokine,
	logStats : logStats
} )


sim.chemokine = new CPM.Grid2D([sim.C.extents[0],sim.C.extents[1]], config.torus, "Float32")


console.log( "time,conc,mass")

sim.run()
