# Analysis pipeline

## Quickstart (using conda)

First install dependencies using:

```
conda env create -f env.yml
```

then activate

```
conda activate angio-analysis
```

Download the data from all frameworks from the surfdrive. The current setup assumes
a specific folder structure and file naming as currently in the surfdrive 
(currently, this is automatically achieved 
by downloading the `compare_multipleruns` from the surfdrive in the right location):
`path/to/angiogenesis-cpm/Analysis/full-comparison/compare_multipleruns`. For details, 
see below.

### Running the pipeline (using Make)

If you have GNU Make (https://www.gnu.org/software/make/), you can easily run the 
analysis as follows. 

First, in line 5 of the `Makefile`, set the `MAXPROC` variable to the max number of cores
you want to use for parallel analysis (default is min(4,available cores)). 
Then simply run:

```
make data/combined-chemstrength-data.csv
```

This will run analysis for all the frameworks and then combine the result in one csv file.

Then, to create the plot using `src/plot-comparison.R`

```
make plots/comp-chemstrength.pdf
```

(to change colors, change the hex codes in line 10 of `src/plot-comparison.R`)

### Running the pipeline (without Make)

If you don't have GNU Make you can still run the analysis manually. First: ensure the
`data` folder exists, and then create the 
analysis csv files per software platform and per parameter scan, e.g.:

```
mkdir data
python analyse.py -s src/get-num-domains.py -i compare_multipleruns/Artistoo/chemstrength_scan -w Artistoo -o data/Artistoo-chemstrength.csv -j 4
python analyse.py -s src/get-num-domains.py -i compare_multipleruns/CC3D/chemstrength_scan -w CC3D -o data/CC3D-chemstrength.csv -j 4
python analyse.py -s src/get-num-domains.py -i compare_multipleruns/Morpheus/chemstrength_scan -w Morpheus -o data/Morpheus-chemstrength.csv -j 4
```

This will analyse the images in the input directory as specified by the `-i` flag, using 
`-j` = 4 cores, and produce the `-o` output csv file.

Next, combine the resulting csv files into one, with unified format:

```
Rscript src/combine-csv.R data/CC3D-chemstrength.csv data/Morpheus-chemstrength.csv data/Artistoo-chemstrength.csv data/combined-chemstrength.csv
```

Finally, create the `plots` directory and run the plotting script:

```
mkdir plots
Rscript src/plot-comparison.R data/combined-chemstrength-data.csv chemstrength plots/comp-chemstrength.pdf
```

(or replace all "chemstrength" with e.g. "cellcell", "satstrength", or "vegfdegr" as required).


## Folder structure

Inside `path/to/angiogenesis-cpm/Analysis/full-comparison/compare_multipleruns`, we assume:

- `Artistoo/`

	- `cellcell_scan/` :
		- angiogenesis-Temp5-Jcm4-Jcc<b>[value]</b>-D1-prod0.3-decay0.3-sat0.1-lchem500-seed1-t500.png
	- `chemstrength_scan/` : 
		- angiogenesis-Temp5-Jcm4-Jcc1-D1-prod0.3-decay0.3-sat0.1-lchem<b>[value]</b>-seed1-t500.png
	- `satstrength_scan/` : 
		- angiogenesis-Temp5-Jcm4-Jcc1-D1-prod0.3-decay0.3-sat<b>[value]</b>-lchem500-seed1-t500.png		
	- `vegfdegr_scan/` : 
		- angiogenesis-Temp5-Jcm4-Jcc1-D1-prod0.3-decay<b>[value]</b>-sat0.1-lchem500-seed1-t500.png

- `CC3D`
	- `cellcell_scan/` :
		- Snap_4.0\_<b>[value]</b>\_500.0_0.1_1.0_0.3_0.3_[seed].png
	- `chemstrength_scan/` : 
		- Snap_4.0\_1.0\_<b>[value]</b>\_0.1_1.0_0.3_0.3_[seed].png
	- `satstrength_scan/` : 
		- Snap_4.0\_1.0\_500.0_<b>[value]</b>\_1.0_0.3_0.3_[seed].png		
	- `vegfdegr_scan/` : 
		- Snap_4.0\_1.0\_500.0_0.1_1.0_<b>[value]</b>\_0.3_[seed].png	

- `Morpheus`
	- `cellcell_scan/` :
		- cellcell_<b>value</b>\_[seed].png	
	- `chemstrength_scan/` : 
		- chemstrength_<b>value</b>\_[seed].png	
	- `satstrength_scan/` : 
		- satstrength_<b>value</b>\_[seed].png	
	- `vegfdegr_scan/` : 
		- vegfdegr_<b>value</b>\_[seed].png	