const { buildSimulation } = require("./build-simulation.js")

/*
	The base model (Schemas/model-specification.md), expressed via the builder.
	No overrides needed: buildSimulation()'s defaults are the base model itself
	- every unit test declares its deviations from this same baseline.
*/

const sim = buildSimulation()

sim.seedCells()

sim.run()
