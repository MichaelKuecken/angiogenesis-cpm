# Artistoo angiogenesis unit test implementations

Tests currently implemented : 

- [x] Test 1 (single CPM cell, no chemokine)
- [x] Test 2 (multiple CPM cells, no chemokine)
- [x] Test 3 (PDE with no CPM cells)
- [x] Test 4 (PDE with no CPM cells and no diffusion)
- [x] Test 5 (coupling PDE with a single but fixed CPM cell)


## Quick start (using conda)

Install the conda environment using the file `env.yml` : 

```
conda env create -f env.yml
```

Then activate it:

```
conda activate angio-artistoo
```

Finally, you can (locally) install the required Node.js packages using:

```
npm install
```

You'll also need the Artistoo CPM library itself, which isn't vendored in this
repo. Download it into `../../Implementations/artistoo/src/artistoo-cjs.js`
(the shared location `src/build-simulation.js` requires it from):

```
curl -sL https://cdn.jsdelivr.net/gh/ingewortel/artistoo@1.2.0/build/artistoo-cjs.js -o ../../Implementations/artistoo/src/artistoo-cjs.js
```

You are now ready to run a test, e.g.:

```
python run-test1.py -j 4
```

This will generate a folder `output/test1` and store output there. 


## Requirements (without conda)

### Without conda

#### Node.js and npm

To run artistoo simulaitons, you will need Node.js and its package manager npm. 
See: https://nodejs.org/en/download/. 

Standard package managers sometimes install incompatible versions of npm and nodejs. 
To avoid this, on Linux/MacOS you can install both at once using nvm:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install --lts
nvm use --lts
```

After that, you still need to install Node.js dependencies as listed in the 
`package.json` and `package-lock.json` files using:

```
npm install
```

#### Artistoo library

`src/build-simulation.js` (and everything built on it) requires the Artistoo
CPM library from `../../Implementations/artistoo/src/artistoo-cjs.js`, which
isn't vendored in the repo. If you use `make`, this happens automatically.
Otherwise (e.g. "Quick start" above), download it yourself - see there, or
`Implementations/artistoo/README.md`, for instructions.

#### Python

To use the wrapper script that runs multiple simulations and scans over parameters,
you will need Python (I have tested on 3.12.2), along with:

- pip
- numpy
- pandas
- argparse
- Naked
- tqdm

## Additional experiments

Beyond the specified tests above, this implementation supports a few extra
investigative runs that go beyond `Schemas/model-specification.md`, as examples to 
feed the comparison analysis or to investigate potential reasons for mismatching 
unit tests between frameworks. the `Makefile` helps run all of those; see below.


### Alternate neighborhood configuration (Test 1 / Test 2)

Tests 1 and 2 can also be run with a non-spec CPM neighborhood configuration
(`-b` flag), to demonstrate that the unit test can pick up on such
differences. This also runs automatically with `make all`.

```
make test1
make test2
```

### Operator ordering modes (Test 3 / Test 4 / Test 5)

The chemokine PDE can be updated in one of four ways - `Orig`, `Sync`,
`CC3D`, or `Morpheus`. `Orig` corresponds to the original Artistoo implementation,
`Sync` is the new agreed default, and `CC3D` and `Morpheus` were designed to match 
those framework's defaults respectively.  

```
make test3
make test4
make test5
```

### Spatial resolution scaling (Test 3)

Test 3 also supports a spatial resolution scaling factor `-f`, which
rescales the grid, `D`, `Nd`, and `alpha` together (see `src/test3-4.js` for
the reasoning behind how each parameter scales). This checks that the PDE
solution is resolution-invariant. Not run as part of `make all` since higher
scaling factors get heavy fast:

```
make test3-scaling
```

### Equal decay comparison (Test 3b)

Test 3 (per spec) exempts the secretion point from decay. `test3b-equaldecay.js`
instead applies decay everywhere, including at the secretion point. With decay
applied uniformly, the total chemokine mass follows a simple ODE,
`dM/dt = alpha - epsilon*M`, with analytical solution
`M(t) = (alpha/epsilon)*(1 - exp(-epsilon*t))` - so the `mass` column this
script reports can be compared directly against that analytical solution, as
a check on the PDE solver itself. Also not run as part of `make all`:

```
make test3b-equaldecay
```

### Pure diffusion kernel (Test 4b)

`test4b-onlydiff.js` isolates the diffusion term from Test 3/4's secretion
and decay dynamics: a single one-time chemokine pulse is placed at the grid
midpoint before the run starts, with secretion and decay both disabled, so
it just diffuses outward from that point with nothing else confounding it.
Not run as part of `make all`:

```
make test4b-onlydiff
```

