/*
	Test 2: multi-cell CPM dynamics without PDE.
	See "Test 2" in Schemas/model-specification.md for the full spec.
	Changes wrt the base model (angiogenesis-simulation.js):
	- CPM initialization: seed 9 cells as 7x7 pixel squares in a 3x3 grid
	  around the center; cell 5 (the (0,0)-offset box) ends up in the middle.
	- Disable PDE: D = alpha = epsilon = 0.
	- Output: CSV of time, com, area, surface for the middle cell every 10 MCS.

	-b : "Test 2b" variant, using a non-spec adhesion neighborhood order (2,
	     instead of the spec's 4; sampling order stays at the spec value, 1),
	     to demonstrate that the unit test can pick up on such differences.
*/


const CPM = require("../../../Implementations/artistoo/src/artistoo-cjs.js")
const { buildSimulation, getInput } = require("../../../Implementations/artistoo/src/build-simulation.js")

const seed = getInput( "x", 1, "int" )
const altNbh = getInput( "b", false, "boolean" )

/* OVERRIDES TO BASELINE SIMULATOR: */

// test2 seeds 9 cells as 7x7 boxes in a 3x3 grid; loop order (xi outer,
// yi inner, both -1..1) makes the (0,0) box - dead center - cell id 5.
function seedCells(){

	this.addGridManipulator()

	for( let xi = -1; xi <= 1; xi++ ){
		for( let yi = -1; yi <= 1; yi++ ){
			const x0 = 100 + xi * 7 // bottom left of box (x-coordinate)
			const y0 = 100 + yi * 7 // bottom left of box (y-coordinate)
			const box = this.gm.makeBox( [x0, y0], [7, 7] )
			this.gm.assignCellPixels( box, 1 )
		}
	}

}

// PDE is disabled for this test (D = alpha = epsilon = 0, see params below):
// skip the chemokine update entirely, for speed.
function postMCSListener(){}

// report time, com, area, surface for the middle cell (id 5) every 10 MCS.
function logStats(){

	let tt = this.time + 1

	if( tt % 10 == 0 ){

		const id = 5

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
	conf: altNbh ? { seed, NbhOrder: { sampling: 1, adhesion: 2 } } : { seed },
	field_config: { D: 0, alpha: 0, epsilon: 0 },
	simsettings: {
		NRCELLS: [9],
		SAVEIMG: false,
		STATSOUT: { browser: false, node: true }
	},
	hooks: { seedCells, postMCSListener, logStats }
})

sim.seedCells()
console.log( "time,rep,com_1,com_2,area,surface")

sim.run()
