/*
	Test 3 & 4: PDE basics, with/without diffusion (no CPM cells).
	See "Test 3" and "Test 4" in Schemas/model-specification.md for the full
	specs. Test 4 is Test 3 with D = 0 and a different measurement point -
	both are the same script here, run with different flags:
	  Test 3: (defaults) -p 80
	  Test 4: -D 0 -p 100
	Changes wrt the base model (angiogenesis-simulation.js):
	- CPM initialization: seed a single frozen "cell" pixel at the fixed grid
	  midpoint, and never update the CPM - this makes the shared
	  updateChemokine's CPM-occupancy check ("is this pixel a cell?") behave
	  exactly like the spec's fixed point source, with no extra logic needed.
	- Output: CSV of the chemokine concentration at (p,p) and total
	  chemokine mass every 10 MCS, instead of images.

	-c : which chemokine-update mode to use - Orig, Sync (default), CC3D, or
	     Morpheus. Same flag as the main simulation. With D = 0 (Test 4)
	     there is no diffusion and no spatial coupling between pixels, so
	     secretion and decay are independent per-pixel operations that
	     commute regardless of order - all four modes should therefore give
	     identical output.
	-f : spatial resolution scaling factor (default 1). Rescales the grid,
	     D, Nd, alpha, and the source/measurement positions together, to
	     test that the PDE solution is resolution-invariant.
	-p : measurement point (p,p) to report the chemokine concentration at
	     (default 80, matching Test 3; Test 4 uses 100).
*/


const { buildSimulation, getInput } = require("./build-simulation.js")

const f = getInput( "f", 1, "int" )
const D0 = getInput( "D", 1.0, "float" )
const a0 = getInput( "a", 0.3, "float" )
const p = getInput( "p", 80, "int" )

/* OVERRIDES TO BASELINE SIMULATOR: */

// seed a single cell at the fixed source position; the CPM is frozen below
// so it never moves or grows, giving a single static source pixel as per the spec.
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
	params: {
		fieldsize: [200*f, 200*f],
		Ncell: 1,
		D: D0 * f * f,
		a: a0 * f * f,
		Nd: 10 * f * f
	},
	simsettings: {
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, step, logStats }
})

sim.seedCells()
console.log( "time,conc,mass" )

sim.run()
