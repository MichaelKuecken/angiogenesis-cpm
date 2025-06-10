.SECONDARY :
.DELETE_ON_ERROR : 

NSIM=10
MAXPROC=4


PLATFORMS=Artistoo CC3D Morpheus
all-platforms : $(foreach p, $(PLATFORMS), data/$(p)-chemstrength.csv data/$(p)-cellcell.csv data/$(p)-satstrength.csv data/$(p)-vegfdegr.csv )

SCANS=chemstrength cellcell satstrength vegfdegr
all-data : $(foreach s, $(SCANS), data/combined-$(s)-data.csv ) 

	
	
data : 
	mkdir -p $@
	
plots : 
	mkdir -p $@
	
compare_multipleruns/Artistoo/chemstrength_scan/.copy : 
	cp ../artistoo-simulations/img/screen-lchem/*t500.png compare_multipleruns/Artistoo/chemstrength_scan && touch $@

compare_multipleruns/Artistoo/cellcell_scan/.copy : 
	cp ../artistoo-simulations/img/screen-Jcc/*t500.png compare_multipleruns/Artistoo/cellcell_scan && touch $@

compare_multipleruns/Artistoo/satstrength_scan/.copy : 
	cp ../artistoo-simulations/img/screen-satcoef/*t500.png compare_multipleruns/Artistoo/satstrength_scan && touch $@

compare_multipleruns/Artistoo/vegfdegr_scan/.copy : 
	cp ../artistoo-simulations/img/screen-VEGFdecay/*t500.png compare_multipleruns/Artistoo/vegfdegr_scan && touch $@


data/%-chemstrength.csv : analyse.py src/get-num-domains.py | data compare_multipleruns/Artistoo/chemstrength_scan/.copy
	python $< -s src/get-num-domains.py -i compare_multipleruns/$*/chemstrength_scan -w $* -o $@ -j $(MAXPROC)

data/%-cellcell.csv : analyse.py src/get-num-domains.py | data compare_multipleruns/Artistoo/cellcell_scan/.copy
	python $< -s src/get-num-domains.py -i compare_multipleruns/$*/cellcell_scan -w $* -o $@ -j $(MAXPROC)

data/%-satstrength.csv : analyse.py src/get-num-domains.py | data compare_multipleruns/Artistoo/satstrength_scan/.copy 
	python $< -s src/get-num-domains.py -i compare_multipleruns/$*/satstrength_scan -w $* -o $@ -j $(MAXPROC)

data/%-vegfdegr.csv : analyse.py src/get-num-domains.py | data compare_multipleruns/Artistoo/vegfdegr_scan/.copy
	python $< -s src/get-num-domains.py -i compare_multipleruns/$*/vegfdegr_scan -w $* -o $@ -j $(MAXPROC)
	

data/combined-%-data.csv : src/combine-csv.R data/CC3D-%.csv data/Morpheus-%.csv data/Artistoo-%.csv
	Rscript $^ $@

# ========= PLOTS

comparison-plots : $(foreach s, $(SCANS), plots/comp-$(s).pdf )
estimation-plots : $(foreach s, $(SCANS), plots/estimation-$(s).pdf )
metric-plots : $(foreach s, $(SCANS), plots/metrics-$(s).pdf )

plots/comp-%.pdf : src/plot-comparison.R data/combined-%-data.csv | plots
	Rscript $^ $* $@

plots/metrics-%.pdf : src/plot-all-metrics.R data/combined-%-data.csv | plots
	Rscript $^ $* $@

plots/estimation-%.pdf : src/estimation-plots.R data/combined-%-data.csv | plots
	Rscript $^ $* $@