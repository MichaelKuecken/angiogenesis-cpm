/*
	Test 1: single cell CPM dynamics without PDE.
	See "Test 1" in Schemas/model-specification.md for the full spec.
	Changes wrt the base model (angiogenesis-simulation.js):
	- CPM initialization: seed one EC as a single pixel in the middle of the grid.
	- Disable PDE: D = alpha = epsilon = 0, and skip the PDE update entirely.
	- Output: CSV of time, com, area, surface every 10 MCS, instead of images.

	-b : "Test 1b" variant, using a non-spec neighborhood configuration
	     (sampling order 2, adhesion order 2, instead of the spec's (1, 4)),
	     to demonstrate that the unit test can pick up on such differences.
*/


const CPM = require("../../../Implementations/artistoo/src/artistoo-cjs.js")
const { buildSimulation, getInput } = require("../../../Implementations/artistoo/src/build-simulation.js")

const seed = getInput( "x", 1, "int" )
const altNbh = getInput( "b", false, "boolean" )

/* OVERRIDES TO BASELINE SIMULATOR: */
// test1 seeds only a single cell at the center.
function seedCells(){
	this.addGridManipulator()
	this.gm.seedCellAt( 1, [100,100])
}

// test1 disables the PDE (D = alpha = epsilon = 0), so just skip PDE in
// postMCSListener entirely for speed.
function postMCSListener(){}

// adapt logging to report: time, x, y, area, surface every 10 MCS, no images. 
// report time, com, area, surface for the (only) cell every 10 MCS.
function logStats(){

	let tt = this.time + 1

	if( tt % 10 == 0 ){

		const id = 1

		const centroid = this.C.getStat( CPM.CentroidsWithTorusCorrection )[id]
		const area = this.C.getVolume(id)

		const adh = this.C.getConstraint( "Adhesion2" )
		const pix = this.C.getStat( CPM.PixelsByCell )[id]
		let perim = 0
		for( let p of pix ){
			perim += adh.surf( this.C.grid.p2i( p ), id )
		}

		console.log( tt + "," + seed + "," + centroid.join(",") + "," + area + "," + perim )

	}

}


/* CONSTRUCT & RUN */
const sim = buildSimulation({
	conf: altNbh ? { seed, NbhOrder: { sampling: 2, adhesion: 2 } } : { seed },
	field_config: { D: 0, alpha: 0, epsilon: 0 },
	simsettings: {
		NRCELLS: [1],
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, postMCSListener, logStats }
})

sim.seedCells()
console.log( "time,rep,com_1,com_2,area,surface")
sim.run()
