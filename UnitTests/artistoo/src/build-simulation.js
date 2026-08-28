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

/*
	Builds a CPM.Simulation object faithfully reproducing the base
	angiogenesis-simulation.js in UnitTests/artistoo/src, allowing individual
	unit tests to declare only their deviations from that base model instead of
	copying the entire file.

	`overrides` may contain:
	- params: object of { D, a, e, Ncell } overriding the corresponding CLI-derived
	  defaults (matches the "Changes wrt the original simulation" style deviations
	  in Schemas/model-specification.md, e.g. disabling the PDE with D=a=e=0).
	- simsettings: object merged into config.simsettings (e.g. SAVEPATH, EXPNAME,
	  zoom, STATSOUT, NRCELLS).
	- hooks: object merged into the CPM.Simulation hooks (seedCells,
	  initializeGrid, postMCSListener, updateChemokine, drawCanvas, logStats,
	  step, ...), overriding the defaults below.
	- AdhesionClass: constraint class to instantiate instead of the default
	  Adhesion2 (e.g. a subclass adding extra methods). Note: if code elsewhere
	  looks the constraint up via C.getConstraint("Adhesion2"), the subclass must
	  still be declared as `class Adhesion2 extends ...` so its constructor name
	  matches, since Artistoo indexes constraints by constructor.name.

	Returns the constructed `sim`, before `sim.seedCells()` / `sim.run()` are
	called, so the caller can still print headers or do other setup first.
*/
function buildSimulation( overrides = {} ){

	const params = overrides.params || {}

	const seed = getInput( "x", 1, "int" )
	const T = getInput( "T", 5, "int" )
	const Jcm = getInput( "j", 4, "int" )
	const Jcc = getInput( "J", 1, "int" )
	const D = params.D !== undefined ? params.D : getInput( "D", 1.0, "float" )
	const a = params.a !== undefined ? params.a : getInput( "a", 0.3, "float" )
	const e = params.e !== undefined ? params.e : getInput( "e", 0.3, "float" )
	const Nd = params.Nd !== undefined ? params.Nd : 10
	const s = getInput( "s", 0.1, "float" )
	const mu = getInput( "m", 500, "int" )
	const mode = getInput( "c", "Sync", "string" )
	const drawGradient = getInput( "g", false, "boolean" )
	const imgpath = getInput( "i", "output/img", "string" )

	const saveImg = true
	const expName = "angiogenesis-" + mode + "-Temp" + T + "-Jcm" + Jcm + "-Jcc" + Jcc + "-D" + D + "-prod" + a + "-decay" + e + "-sat" + s + "-lchem" + mu + "-seed" + seed

	fs.mkdirSync(imgpath, { recursive: true })

	let fieldsize = params.fieldsize !== undefined ? params.fieldsize : [200,200]
	let Ncell = params.Ncell !== undefined ? params.Ncell : 400
	let NbhOrder = Object.assign( { sampling: 1, adhesion: 4 }, params.NbhOrder || {} )

	let config = {

		field_size : fieldsize,

		conf : {
			torus : [true,true],
			seed : seed,
			T : T,
			D : D,
			Nd : Nd,
			alpha : a,
			epsilon : e,
			J2: [[0,Jcm], [Jcm,Jcc]],
			LAMBDA_V : [0,5],
			V : [0,50],
			NbhOrder : NbhOrder
		},
		simsettings : {

			NRCELLS : [Ncell],
			INNERFIELD : fieldsize,
			RUNTIME : 501,

			BURNIN : 0,
			CELLCOLOR : ["000000"],
			SAVEIMG : saveImg,
			IMGFRAMERATE : 10,
			SAVEPATH: imgpath,
			EXPNAME : expName,
			zoom : 1,
			STATSOUT : { browser: false, node: false }

		}
	}

	Object.assign( config.simsettings, overrides.simsettings || {} )

	let chem_config = {
			LAMBDA_CH: [0,mu],
			X : 0,
			s : s,
			retract : true,
			CH_FIELD : {} // will be defined below
	}

	function initializeGrid(){} // overwrite to do nothing until we replace with custom grid
	function defaultSeedCells(){

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

	// called by postMCSListener after every MCS. Modes match the main
	// simulation (Implementations/artistoo/src/angiogenesis-simulation.js).
	function defaultUpdateChemokine( D, alpha, epsilon ){

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
		  	// all operations are performed simultaneously on cached grid.
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
	function defaultPostMCSListener(){

		// chemokine dynamics at Nd steps per MCS
		const Nd = this.C.conf.Nd
		const effectiveDiffusionRate = this.C.conf["D"] / Nd
		const effectiveAlpha = this.C.conf.alpha / Nd
		const effectiveEpsilon = this.C.conf.epsilon / Nd
		for( let i = 0 ; i < Nd ; i ++ ){
			this.updateChemokine( effectiveDiffusionRate, effectiveAlpha, effectiveEpsilon )
		}

	}

	function defaultDrawCanvas(){

		if( !this.helpClasses["canvas"] ){ this.addCanvas() }

		this.Cim.clear("ffffff")

		if( drawGradient ){
			this.Cim.drawField( this.chemokine )
		}

		this.Cim.drawCells( 1, "00aa00")
		//this.Cim.drawCellBorders( -1, "000000")

	}

	const hooks = Object.assign( {
		seedCells : defaultSeedCells,
		initializeGrid : initializeGrid,
		postMCSListener : defaultPostMCSListener,
		updateChemokine : defaultUpdateChemokine,
		drawCanvas : defaultDrawCanvas
	}, overrides.hooks || {} )

	let sim = new CPM.Simulation( config, hooks )

	// overwrite the default grid with one with custom neighborhood functions
	sim.C.grid = new CustomGrid( config.field_size, config.conf.torus, config.conf.NbhOrder.sampling )
	sim.C.midpoint = sim.C.grid.midpoint
	sim.C.field_size = sim.C.grid.field_size
	sim.C.pixels = sim.C.grid.pixels.bind(sim.C.grid)
	sim.C.pixti = sim.C.grid.pixti.bind(sim.C.grid)
	sim.C.neighi = sim.C.grid.neighi.bind(sim.C.grid)
	sim.C.extents = sim.C.grid.extents

	const AdhesionClass = overrides.AdhesionClass || Adhesion2
	sim.C.add( new AdhesionClass( {J2 : config.conf.J2, order : config.conf.NbhOrder.adhesion }  ))
	//sim.C.add( new CPM.ConnectivityConstraint( {CONNECTED: [true, true ]} ) )

	sim.chemokine = new CPM.Grid2D([sim.C.extents[0],sim.C.extents[1]], config.torus, "Float32")
	chem_config.CH_FIELD = sim.chemokine
	sim.C.add( new ChemotaxisConstraintCI( chem_config 	) )

	return sim
}

module.exports = { buildSimulation, getInput, args }
