# Artistoo angiogenesis simulations

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

You are now ready to go, e.g. to run the scan over parameter $\lambda_\text{chemotaxis}$
as listed in `parms/screen-lchem.txt` with N=10 replicates and j=4 parallel cores, run:

```
python run.py -s src/angiogenesis-simulation.js -f parms/screen-lchem.txt -n 10 -j 4 -i img/screen-lchem 
```

This will generate a folder `img/screen-lchem` and store output images there. 

## Running a custom parameter scan

You can run a scan over any (set of) parameter(s) using an input `.txt` file such 
as the ones in the `parms/` folder. This 
file should be tab-delimited, have column names matching the argument flags of 
the node script (see below), and every row should correspond to one parameter combination.

Currently supported input flags for model parameters are:

- `-T` the CPM temperature (a.u.)
- `-j` cell-matrix adhesion (number of edges)
- `-J` cell-cell adhesion (number of edges)
- `-D` diffusion coefficient (pix<sup>2</sup>/MCS)
- `-a` VEGF secretion rate (MCS<sup>-1</sup>)
- `-e` VEGF degradation rate (MCS<sup>-1</sup>)
- `-s` saturation coefficient
- `-m` $\mu$ or $\lambda_\text{chemotaxis}$ parameter (chemotactic strength)

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

#### Python

To use the wrapper script that runs multiple simulations and scans over parameters,
you will need Python (I have tested on 3.12.2), along with:

- pip
- numpy
- pandas
- argparse
- Naked
- tqdm

