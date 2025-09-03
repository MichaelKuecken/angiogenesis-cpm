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

#### Python

To use the wrapper script that runs multiple simulations and scans over parameters,
you will need Python (I have tested on 3.12.2), along with:

- pip
- numpy
- pandas
- argparse
- Naked
- tqdm

