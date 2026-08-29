let CPM = require("./artistoo-cjs.js")
const fs = require("fs")
const args = require('minimist')(process.argv.slice(2));
const { ChemotaxisConstraintCI, CustomGrid, Adhesion2 } = require("./custom-classes.js")

/* Helper function to extract values nicely from CLI*/
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
	Builds a CPM.Simulation object but does not run it yet, allowing individual
	unit tests to declare only their deviations from that base model.

	`overrides` may contain:
	- fieldsize: [width,height] overriding the default grid size ([200,200]).
	- conf: object merged (shallowly, via Object.assign) into config.conf,
	  overriding any of its fields below (seed, T, torus, J2, LAMBDA_V, V,
	  NbhOrder - fixed in the base model unless varied via this route). 
	  NbhOrder is {sampling, adhesion}; since the merge is shallow,
	  overriding conf.NbhOrder replaces the whole object at once - a caller
	  that wants to change only one of its two sub-keys must still spell out
	  the other explicitly (and must omit the NbhOrder key entirely to leave
	  both at their defaults, rather than passing {}).
	- field_config: object merged (shallowly, via Object.assign) into
	  config.field_config - the chemokine field's own parameters (D, Nd,
	  alpha, epsilon) plus the operator-ordering mode (mode: "Orig", "Sync",
	  "CC3D", or "Morpheus").
	- simsettings: object merged (shallowly, via Object.assign) into
	  config.simsettings (e.g. SAVEPATH, zoom, STATSOUT, NRCELLS, RUNTIME -
	  these aren't simulation parameters, just output/rendering settings).
	- chem_config: object merged (shallowly, via Object.assign) into
	  config.chem_config, the ChemotaxisConstraintCI config (LAMBDA_CH, X, s,
	  retract - CH_FIELD is always overwritten below regardless, since it
	  must point at this sim's own chemokine grid).
	- hooks: object merged into the CPM.Simulation hooks (seedCells,
	  initializeGrid, postMCSListener, updateChemokine, drawCanvas, logStats,
	  step, ...), overriding the defaults below.

	Returns the constructed `sim`, before `sim.seedCells()` / `sim.run()` are
	called, so the caller can still print headers or do other setup first.
*/
function buildSimulation( overrides = {} ){

	let fieldsize = overrides.fieldsize !== undefined ? overrides.fieldsize : [200,200] 	// 140,140

	// start from defaults, then override below using the overrides object.
	let config = {

		field_size : fieldsize,

		// CPM parameters and configuration
		conf : {
			torus : [true,true],
			seed : 1,
			T : 5,
			J2: [[0,4], [4,1]], 
			LAMBDA_V : [0,5],
			V : [0,50],
			NbhOrder : { sampling: 1, adhesion: 4 } 
		},

		// chemokine field parameters and operator-ordering mode (not native to artistoo API but used below)
		field_config : {
			D : 1.0, // diffusion coefficient in pix^2 / MCS
			Nd : 10, // execute diffusion in Nd steps/MCS
			alpha : 0.3, // secretion rate per MCS
			epsilon : 0.3, // decay rate per MCS
			mode : "Sync" //operator splitting; "Orig" (original simulation), "CC3D" (mimic CC3D default), "Sync" (diffusion/decay/secretion all simultanaeous), or "Morpheus" (mimic Morpheus)
		},

		simsettings : {

			NRCELLS : [400],
			INNERFIELD : fieldsize,
			RUNTIME : 501,
			BURNIN : 0,
			CELLCOLOR : ["000000"],
			SAVEIMG : true,
			IMGFRAMERATE : 500,
			SAVEPATH: "output/img",
			EXPNAME : "", // if no custom override, default constructed from parameters below.
			zoom : 1,
			STATSOUT : { browser: false, node: false }

		},

		chem_config : {
			LAMBDA_CH: [0,500],
			X : 0,
			s : 0.1,
			retract : true,
			CH_FIELD : {} // will be defined below
		}
	}

	Object.assign( config.conf, overrides.conf || {} )
	Object.assign( config.field_config, overrides.field_config || {} )
	Object.assign( config.simsettings, overrides.simsettings || {} )
	Object.assign( config.chem_config, overrides.chem_config || {} )

	fs.mkdirSync(config.simsettings.SAVEPATH, { recursive: true })

	if( config.simsettings.EXPNAME === "" ){
		config.simsettings.EXPNAME = `angiogenesis${config.field_config.mode}-Temp${config.conf.T}-Jcm${config.conf.J2[0][1]}-Jcc${config.conf.J2[1][1]}-D${config.field_config.D}-prod${config.field_config.alpha}-decay${config.field_config.epsilon}-sat${config.chem_config.s}-lchem${config.chem_config.LAMBDA_CH[1]}-seed${config.conf.seed}`
	}

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

	// called by postMCSListener after every MCS
	function defaultUpdateChemokine( D, alpha, epsilon ){

		switch(config.field_config.mode) {
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
			throw( `Unknown mode : ${config.field_config.mode} ; choose Orig, Sync, CC3D, or Morpheus.`)
		}




	}

	// called after every MCS
	function defaultPostMCSListener(){

		// chemokine dynamics at Nd steps per MCS
		const Nd = config.field_config.Nd
		const effectiveDiffusionRate = config.field_config.D / Nd
		const effectiveAlpha = config.field_config.alpha / Nd
		const effectiveEpsilon = config.field_config.epsilon / Nd
		for( let i = 0 ; i < Nd ; i ++ ){
			this.updateChemokine( effectiveDiffusionRate, effectiveAlpha, effectiveEpsilon )
		}

	}

	function defaultDrawCanvas(){

		if( !this.helpClasses["canvas"] ){ this.addCanvas() }


		this.Cim.clear("ffffff")
		this.Cim.drawCells( 1, "00aa00")

	}

	const hooks = Object.assign( {
		seedCells : defaultSeedCells,
		initializeGrid : function(){},	// do nothing until after replacing the grid, then call seedCells.
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

	// add the custom neighborhood adhesion term, chemokine field, and chemotaxis term.
	sim.C.add( new Adhesion2( {J2 : config.conf.J2, order : config.conf.NbhOrder.adhesion }  ))
	sim.chemokine = new CPM.Grid2D([sim.C.extents[0],sim.C.extents[1]], config.torus, "Float32")
	config.chem_config.CH_FIELD = sim.chemokine
	sim.C.add( new ChemotaxisConstraintCI( config.chem_config 	) )

	return sim
}

module.exports = { buildSimulation, getInput, args }
