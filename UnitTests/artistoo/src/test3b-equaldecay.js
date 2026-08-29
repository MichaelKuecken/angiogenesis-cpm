/*
	Test 3b: PDE basics, with decay applied everywhere including the source
	pixel - NOT gated/exempted like test3-4.js (which correctly matches the
	spec's epsilon(p_mid) = 0). This deliberately deviates from the spec: with
	decay applied uniformly, total chemokine mass follows a simple ODE,
	dM/dt = alpha - epsilon*M, with analytical solution
	M(t) = (alpha/epsilon)*(1 - exp(-epsilon*t)), so the "mass" output here
	can be compared directly against that analytical solution.
	See "Test 3" in Schemas/model-specification.md for the base spec that
	this deviates from; see test3-4.js for the spec-compliant version.

	Same CLI as test3-4.js (-c mode, -f scaling, -D, -a, -p), except decay is
	never gated at the source pixel, in any mode.
*/


const { buildSimulation, getInput } = require("../../../Implementations/artistoo/src/build-simulation.js")

const f = getInput( "f", 1, "int" )
const D0 = getInput( "D", 1.0, "float" )
const a0 = getInput( "a", 0.3, "float" )
const p = getInput( "p", 80, "int" )
const mode = getInput( "c", "Sync", "string" )

/* OVERRIDES TO BASELINE SIMULATOR: */

// seed a single cell at the fixed source position; the CPM is frozen below
// so it never moves or grows, giving a single static source pixel.
function seedCells(){
	this.addGridManipulator()
	this.gm.seedCellAt( 1, [100*f, 100*f] )
}

// freeze the CPM: no Monte Carlo updates, only the chemokine PDE runs.
function step(){
	if( this.running ){
		this.postMCSListener()
		this.createOutputs()
		this.time++
	}
}

// the four chemokine-update modes, same as the main simulation, except
// decay is applied everywhere (including at the source pixel) instead of
// being gated by (1-p).
const updateChemokineByMode = {

	Orig( D, alpha, epsilon ){
		this.chemokine.diffusion( D )
		let update = this.chemokine._pixels.map( (x,i) => {
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return x + ( alpha * p ) - ( epsilon * x )
		})
		this.chemokine._pixels = update
	},

	Sync( D, alpha, epsilon ){
		let update = this.chemokine._pixels.map( (x,i) => {
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return x + ( alpha * p ) - ( epsilon * x ) + D * this.chemokine.laplaciani( i )
		})
		this.chemokine._pixels = update
	},

	CC3D( D, alpha, epsilon ){
		let update2 = this.chemokine._pixels.map( (x,i) => {
			return x - ( epsilon * x ) + D * this.chemokine.laplaciani( i )
		})
		this.chemokine._pixels = update2

		let update = this.chemokine._pixels.map( (x,i) => {
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return  x + ( alpha * p )
		})
		this.chemokine._pixels = update
	},

	Morpheus( D, alpha, epsilon ){
		let update = this.chemokine._pixels.map( (x,i) => {
			const p = ( this.C.pixti(i) > 0 ) ? 1 : 0
			return x + ( alpha * p ) - ( epsilon * x )
		})
		this.chemokine._pixels = update
		this.chemokine.diffusion( D )
	}

}

const updateChemokine = updateChemokineByMode[mode]

if( !updateChemokine ){
	throw( `Unknown mode : ${mode} ; choose Orig, Sync, CC3D, or Morpheus.` )
}

// report chemokine concentration at (p,p) and total chemokine mass every
// 10 MCS.
function logStats(){

	let tt = this.time + 1

	if( tt % 10 == 0 ){
		let conc = this.chemokine.pixti( this.C.grid.p2i( [p*f,p*f]) )
		const mass = this.chemokine._pixels.reduce(function(s,v) { return s + ( v || 0 ); }, 0)
		console.log( tt + "," + conc + "," + mass )
	}

}

/* CONSTRUCT & RUN */
const sim = buildSimulation({
	fieldsize: [200*f, 200*f],
	field_config: {
		D: D0 * f * f,
		alpha: a0 * f * f,
		Nd: 10 * f * f
	},
	simsettings: {
		NRCELLS: [1],
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, step, updateChemokine, logStats }
})

sim.seedCells()
console.log( "time,conc,mass" )

sim.run()
