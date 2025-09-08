# Comparison for Unit Test 2

Standardized script(s) for comparing outputs for unit test 2. For now, just visually
compare relevant metrics; formal statistical analysis and equivalence testing 
will be added later.



## Test details

For the specification of the test itself and the required output format: see 
https://github.com/MichaelKuecken/angiogenesis-cpm/blob/main/Schemas/model-specification.md.

(bottom of the page).

## Setup

### Using conda

```
conda env create -f ../env.yml
conda activate angio-unit-analysis
```

### Manual install

Ensure you have R installed with packages:


  - celltrackR 
  - jsonlite
  - ggbeeswarm
  - patchwork
  - ggplot2
  - dplyr


## How to add your data

To add new data to the plot:

- Move the csv file (as specified in the test spec) to "testdata"
- Add it and descriptive info to `test2-comparison.json`. Fields `name`, `csv` and `color` are required by the plotting script, `desc` is for any description you want to add but is not used.
- Install the correct packages or install and activate the conda environment (see "Setup" above)
- Run the R script in your favourite IDE or just run:

```
Rscript compare-test2.R
```

The new data will appear in `test2-comparison.pdf`.

## Example

An example of the output (here I compared the 'normal' Artistoo implementation with one where I deliberately changed the neighborhood function, to see that we can spot this in the test):

<img width="40%" align="right" alt="image" src="https://github.com/user-attachments/assets/9781121d-01e8-4edf-9576-86cfe10ad489" />

  <b>A</b> Raw tracks starting from coordinate (100,100) where the cell was seeded in this test. <b>B,C</b> Distributions of x and y coordinate over time (solid line: mean, dashed lines: 95% CI across tracks). <b>D</b> Mean squared displacement. <b>E</b> Distribution of observed cell area during the simulation.  <b>F</b> Instantaneous speed distributions (measured over the 10 MCS timestep as specified in the output format). <b>G</b> like E but for the cell surface (see test spec for details on computation).
 
 
