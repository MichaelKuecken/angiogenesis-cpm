# Reference model of contact ihibited angiogenenesis

## Contributors:
Lorenzo Veschini, James Glazier, Rahuman Sheriff, Yi Jiang, Hana Dobrovolny, Michael Kücken 

This repository contains high-level description and schemas to create CPM simulations of Angiogenesis based on previous work published in:

    R Merks et al, PLOS Comp. Biol, 2008. "Contact-Inhibited Chemotaxis in De Novo and Sprouting Blood-Vessel Growth"

## Background
Angiogenesis is a fundamental patterning process in developmental biology. It shows a great deal of adaptability depending on initial and boundary conditions. This is fundamentally a model of in vitro angiogenesis in which we put endothelial cells into a cell culture context (either 2D as in most angio experiments or 3D). The analogy would be closest to the formation of peripheral capillaries during primary vasculogenesis. The model can also illustrate an abstraction of branching angiogenesis.

The model involves only one cell type and one chemical field. It illustrates complex patterning through autocrine chemotaxis, contact inhibition and volume exclusion. Can include elongated cell shapes. 

Tests: diffusion rate, chemotaxis, cell movement, cell-cell contact energies.

## In this repo
* Schema of the Angiogenesis Model
* Scripts to implement the simulation in CompuCell3d and Morpheus.
* Scripts to analyse simulations outputs (binary images)
    * Example image outputs
    * Example data 
* UPCOMING: Scripts to compare outputs from differnt simulation platforms 

## References:

R Merks et al.,
**Contact-Inhibited Chemotaxis in De Novo and Sprouting Blood-Vessel Growth**
DOI: 10.1371/journal.pcbi.1000163 

R Merks and J A Glazier, 
**Dynamic mechanisms of blood vessel growth**
DOI: 10.1088/0951-7715/19/1/000 

R Merks et al.,
**Cell elongation is key to in silico replication of in vitro vasculogenesis and subsequent remodeling.**
DOI:  10.1016/j.ydbio.2005.10.003 

