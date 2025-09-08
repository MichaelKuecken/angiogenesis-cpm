# Comparison for Unit Test 1

Standardized script(s) for comparing outputs for unit test 1. For now, just visually
compare relevant metrics; formal statistical analysis and equivalence testing 
will be added later.



## Test details

For the specification of the test itself and the required output format: see 
(https://github.com/MichaelKuecken/angiogenesis-cpm/blob/main/Schemas/model-specification.md)[https://github.com/MichaelKuecken/angiogenesis-cpm/blob/main/Schemas/model-specification.md]
(bottom of the page).

## Setup

### Using conda

```
conda env create -f ../env.yml
conda activate angio-unit-analysis
```

### Manual install

Ensure you have R installed with packages:



## How to add your data

To add new data to the plot:

- Move the csv file (as specified in the test spec) to "testdata"
- Add it and descriptive info to `test1-comparison.json`
- Install the correct packages or install and activate the conda environment (see "Setup" above)
- Run the R script in your favourite IDE or just run:

```
Rscript compare-test1.R
```

The new data will appear in `test1-comparison.pdf`.