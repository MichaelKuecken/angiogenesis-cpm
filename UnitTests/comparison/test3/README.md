# Comparison for Unit Test 3

Standardized script(s) for comparing outputs for unit test 1. For now, just visually
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

  - jsonlite
  - patchwork
  - ggplot2
  - dplyr


## How to add your data

To add new data to the plot:

- Move the csv file (as specified in the test spec) to "testdata"
- Add it and descriptive info to `test3-comparison.json`. Fields `name`, `csv` and `color` are required by the plotting script, `desc` is for any description you want to add but is not used.
- Install the correct packages or install and activate the conda environment (see "Setup" above)
- Run the R script in your favourite IDE or just run:

```
Rscript compare-test3.R
```

The new data will appear in `test3-comparison.pdf`.

## Example

An example of the output (here I compared the 'normal' Artistoo implementation with one where I deliberately swapped the order of the diffusion vs secretion/decay step, to see that we can spot this in the test):

<img width="729" height="333" alt="image" src="https://github.com/user-attachments/assets/e7193ab0-4c96-41a3-9325-3e862ea7086e" />


<b>A</b> Concentration over time at the output position (80,80). <b>B</b> Idem,  but now expressed as fold-change with respect
to the implementation indicated with "REF". 
 
