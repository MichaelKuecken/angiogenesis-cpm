/*
	Test 4b: pure diffusion kernel (no CPM cells, no secretion, no decay).
	A single one-time chemokine pulse (0.3) is placed at the grid midpoint
	before the run starts; with alpha = epsilon = 0 there is nothing to
	replenish or remove it, so it just diffuses outward from that point -
	this isolates the diffusion term from Test 3's secretion/decay dynamics.
	Reports concentration at both (80,80) and (100,100) every MCS.

	Not part of Schemas/model-specification.md - this is a diagnostic, not
	one of the numbered unit tests.
*/


const { buildSimulation, getInput } = require("../../../Implementations/artistoo/src/build-simulation.js")

const D0 = getInput( "D", 0.1, "float" )

/* OVERRIDES TO BASELINE SIMULATOR: */

// no cells needed: alpha = epsilon = 0, so the CPM-occupancy source check
// never matters.
function seedCells(){}

// freeze the CPM: no Monte Carlo updates, only the chemokine PDE runs.
function step(){
	if( this.running ){
		this.postMCSListener()
		this.createOutputs()
		this.time++
	}
}

// report concentration at (80,80) and (100,100) every MCS (not every 10th).
function logStats(){

	let tt = this.time + 1

	let conc80 = this.chemokine.pixti( this.C.grid.p2i( [80,80]) )
	let conc100 = this.chemokine.pixti( this.C.grid.p2i( [100,100]) )
	console.log( tt + "," + conc80 + "," + conc100 )

}

/* CONSTRUCT & RUN */
const sim = buildSimulation({
	field_config: {
		D: D0,
		alpha: 0,
		epsilon: 0,
		Nd: 1
	},
	simsettings: {
		NRCELLS: [0],
		RUNTIME: 100,
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, step, logStats }
})

sim.seedCells()

// a single one-time chemokine pulse at the grid midpoint, placed directly
// (outside the normal secretion/decay/diffusion loop) since alpha = 0.
sim.chemokine._pixels[ sim.chemokine.p2i( [100,100] ) ] = 0.3

console.log( "time,conc80,conc100" )

sim.run()
