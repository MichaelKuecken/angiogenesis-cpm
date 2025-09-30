# Unit tests

# Specification

Tests are specified in the same document as the full model specification:
https://github.com/MichaelKuecken/angiogenesis-cpm/blob/main/Schemas/model-specification.md

Tests are specified as changes with respect to the full, "baseline" model and are accompanied by
specifications for the output format.

# Implementations

Implementations for unit tests in a specific framework can be added here; see e.g. `UnitTests/artistoo/`

# Comparative analysis

A centralized comparison pipeline is set up under `UnitTests/comparison/testX`. 

This assumes that:

- output files have been generated as described in the test specifciation
- the location + some metadata have been added to the json in `UnitTests/comparison/testX`

See the README in each `UnitTests/comparison/testX` folder for exact instructions on how to add your data to the comparison plot,
as well as an example comparing two (slightly different) Artistoo implementations in this manner.
