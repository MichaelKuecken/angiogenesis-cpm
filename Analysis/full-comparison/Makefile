.SECONDARY :
.DELETE_ON_ERROR : 

NSIM=50
MAXPROC=4


PLATFORMS=ArtistooOrig ArtistooCC3D ArtistooSync CC3DOrig MorpheusOrig MorpheusSyncV1

all-platforms : $(foreach p, $(PLATFORMS), data/proc-$(p)-chemstrength.csv data/proc-$(p)-cellcell.csv data/proc-$(p)-satstrength.csv data/proc-$(p)-vegfdegr.csv )

SCANS=chemstrength cellcell satstrength vegfdegr
all-data : $(foreach s, $(SCANS), data/combined-$(s)-data.csv ) 


# just calculate stats for every png in the directory
data/raw-%-chemstrength.csv : analyse2.py src/get-num-domains2.py 
	python $< -s src/get-num-domains2.py -i compare_multipleruns/$*/chemstrength_scan -w $* -o $@ -j $(MAXPROC)

data/raw-%-cellcell.csv : analyse2.py src/get-num-domains2.py 
	python $< -s src/get-num-domains2.py -i compare_multipleruns/$*/cellcell_scan -w $* -o $@ -j $(MAXPROC)

data/raw-%-satstrength.csv : analyse2.py src/get-num-domains2.py
	python $< -s src/get-num-domains2.py -i compare_multipleruns/$*/satstrength_scan -w $* -o $@ -j $(MAXPROC)

data/raw-%-vegfdegr.csv : analyse2.py src/get-num-domains2.py 
	python $< -s src/get-num-domains2.py -i compare_multipleruns/$*/vegfdegr_scan -w $* -o $@ -j $(MAXPROC)
	
# process the filenames to extract the corresponding parameters in a postprocessing step
data/proc-%-chemstrength.csv : src/process-csv.R data/raw-%-chemstrength.csv
	Rscript $^ $@

data/proc-%-cellcell.csv : src/process-csv.R data/raw-%-cellcell.csv
	Rscript $^ $@
	
data/proc-%-satstrength.csv : src/process-csv.R data/raw-%-satstrength.csv
	Rscript $^ $@
	
data/proc-%-vegfdegr.csv : src/process-csv.R data/raw-%-vegfdegr.csv
	Rscript $^ $@
	
# Merge all the csv's per parameter screen
data/combined-chemstrength-data.csv : src/combine-csv.R $(foreach p, $(PLATFORMS), data/proc-$(p)-chemstrength.csv )
	Rscript $^ $@
	
data/combined-cellcell-data.csv : src/combine-csv.R $(foreach p, $(PLATFORMS), data/proc-$(p)-cellcell.csv )
	Rscript $^ $@
	
data/combined-satstrength-data.csv : src/combine-csv.R $(foreach p, $(PLATFORMS), data/proc-$(p)-satstrength.csv )
	Rscript $^ $@
	
data/combined-vegfdegr-data.csv : src/combine-csv.R $(foreach p, $(PLATFORMS), data/proc-$(p)-vegfdegr.csv )
	Rscript $^ $@


# ========= PLOTS

comparison-plots : $(foreach s, $(SCANS), plots/compOrig-$(s).pdf )
comparison-plots-CC : $(foreach s, $(SCANS), plots/compCC-$(s).pdf )
comparison-plots-Mo : $(foreach s, $(SCANS), plots/compMo-$(s).pdf )


plots/compOrig-%.pdf : src/plot-comparison.R data/combined-%-data.csv | plots
	Rscript $^ $* 'ArtistooOrig CC3DOrig MorpheusOrig' $@

plots/compCC-%.pdf : src/plot-comparison.R data/combined-%-data.csv | plots
	Rscript $^ $* 'ArtistooCC3D CC3DOrig' $@

plots/compMo-%.pdf : src/plot-comparison.R data/combined-%-data.csv | plots
	Rscript $^ $* 'ArtistooOrig MorpheusOrig' $@


metric-plots : $(foreach s, $(SCANS), plots/metrics-$(s).pdf )


plots/metrics-%.pdf : src/plot-all-metrics.R data/combined-%-data.csv | plots
	Rscript $^ $* $@



estimation-plots : $(foreach s, $(SCANS), plots/estimationOrig-$(s).pdf )
estimation-plots-CC : $(foreach s, $(SCANS), plots/estimationCC-$(s).pdf )


plots/estimationOrig-%.pdf : src/estimation-plots.R data/combined-%-data.csv | plots
	Rscript $^ $* 'ArtistooOrig CC3DOrig MorpheusOrig' $@
	
plots/estimationCC-%.pdf : src/estimation-plots.R data/combined-%-data.csv | plots
	Rscript $^ $* 'ArtistooCC3D CC3DOrig' $@


	
# artistoo-estimation-plots : $(foreach s, $(SCANS), plots/artistoo-estimation-$(s).pdf )
# plots/artistoo-estimation-%.pdf : src/artistoo-estimation-plots.R data/Artistoo100-%.csv | plots
# 	Rscript $^ $* $@
# 	
