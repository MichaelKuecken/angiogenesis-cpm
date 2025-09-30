# Comparison for Unit Test 5

Standardized script(s) for comparing outputs for unit test 5. For now, just compare the concentration at 
one coordinate (this should already indicate any difference). We can extend later if necessary.



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

Alternatively, if not using conda, ensure you have R installed with packages:

  - jsonlite
  - patchwork
  - ggplot2
  - dplyr


## How to add your data

To add new data to the plot:

- Move the csv file (as specified in the test spec) to "testdata"
- Add it and descriptive info to `test5-comparison.json`. Fields `name`, `csv` and `color` are required by the plotting script, `desc` is for any description you want to add but is not used.
- Install the correct packages or install and activate the conda environment (see "Setup" above)
- Run the R script in your favourite IDE or just run:

```
Rscript compare-test5.R
```

The new data will appear in `test5-comparison.pdf`.

## Example

An example of the output (here I compared the Artistoo implementation of test 5 (frozen but larger CPM cell secreting chemokine) with that of test 3 (same PDE but the source is a single pixel):

<img width="729" height="333" alt="image" src="https://github.com/user-attachments/assets/fde9e531-ec51-4798-80c1-b1da3dd889fe" />


