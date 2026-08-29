const { buildSimulation, getInput } = require("./build-simulation.js")

/*
	Main angiogenesis simulation, expressed via the builder shared with
	UnitTests/artistoo/src/build-simulation.js (kept as its own copy here,
	same as artistoo-cjs.js/custom-classes.js already were, rather than
	cross-referencing across the two projects). Only deviates from the
	builder's own base-model defaults in one place: IMGFRAMERATE, set to 500
	here since experiment runs don't need the dense per-10-MCS frame rate the
	UnitTests scripts use.

	-x : seed
	-T : temperature
	-j, -J : Jcm, Jcc (combined into conf.J2, the interaction energy matrix)
	-D : diffusion coefficient
	-a : secretion rate
	-e : decay rate
	-N : diffusion substeps per MCS
	-c : chemokine-update mode - Orig, Sync (default), CC3D, or Morpheus
	-s : chemokine saturation constant
	-m : chemokine field decay length (LAMBDA_CH)
	-i : path to save images to
*/

const seed = getInput( "x", 1, "int" )
const T = getInput( "T", 5, "int" )
const Jcm = getInput( "j", 4, "int" )
const Jcc = getInput( "J", 1, "int" )
const D = getInput( "D", 1.0, "float" )
const a = getInput( "a", 0.3, "float" )
const e = getInput( "e", 0.3, "float" )
const Nd = getInput( "N", 10, "int" )
const mode = getInput( "c", "Sync", "string" )
const s = getInput( "s", 0.1, "float" )
const mu = getInput( "m", 500, "int" )
const imgpath = getInput( "i", "output/img", "string" )

const sim = buildSimulation({
	conf: { seed, T, J2: [[0,Jcm], [Jcm,Jcc]] },
	field_config: { D, alpha: a, epsilon: e, Nd, mode },
	chem_config: { s, LAMBDA_CH: [0,mu] },
	simsettings: { SAVEPATH: imgpath, IMGFRAMERATE: 500 }
})

sim.seedCells()

sim.run()
