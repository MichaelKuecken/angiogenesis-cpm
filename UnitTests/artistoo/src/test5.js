/*
	Test 5: secretion (frozen multi-pixel CPM cell).
	See "Test 5" in Schemas/model-specification.md for the full spec.
	Changes wrt the base model (angiogenesis-simulation.js):
	- CPM initialization: seed a single cell at a specific 49-pixel shape
	  (the result of running Test 1 to equilibrium).
	- Freeze the CPM: no Monte Carlo updates - only the chemokine PDE runs.
	  Since the shared default updateChemokine already uses CPM-cell
	  occupancy to decide the source, no override is needed for it here.
	- Output: CSV of the chemokine concentration at (80,80) every 10 MCS.

	-c : which chemokine-update mode to use - Orig, Sync (default), CC3D, or
	     Morpheus. Same flag as the main simulation.
*/


const { buildSimulation } = require("./build-simulation.js")

/* OVERRIDES TO BASELINE SIMULATOR: */

// seed a single cell at the specific 49-pixel shape from the spec (the
// result of running Test 1 to equilibrium).
function seedCells(){
	this.addGridManipulator()
	const pixelList = [
		[97,99],[97,100],[97,101],[97,102],[98,98],[98,99],
		[98,100],[98,101],[98,102],[98,103],[99,98],[99,99],
		[99,100],[99,101],[99,102],[99,103],[100,98],[100,99],
		[100,100],[100,101],[100,102],[100,103],[100,104],[101,98],
		[101,99],[101,100],[101,101],[101,102],[101,103],[101,104],
		[102,98],[102,99],[102,100],[102,101],[102,102],[102,103],
		[102,104],[103,98],[103,99],[103,100],[103,101],[103,102],
		[103,103],[103,104],[104,99],[104,100],[104,101],[104,102],[104,103] ]
	this.gm.assignCellPixels( pixelList, 1 )
}

// freeze the CPM: no Monte Carlo updates, only the chemokine PDE runs.
function step(){
	if( this.running ){
		this.postMCSListener()
		this.createOutputs()
		this.time++
	}
}

// report chemokine concentration at (80,80) every 10 MCS.
function logStats(){

	let tt = this.time + 1

	if( tt % 10 == 0 ){
		let conc = this.chemokine.pixti( this.C.grid.p2i( [80,80]) )
		console.log( tt + "," + conc )
	}

}

/* CONSTRUCT & RUN */
const sim = buildSimulation({
	simsettings: {
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, step, logStats }
})

sim.seedCells()
console.log( "time,conc" )

sim.run()
