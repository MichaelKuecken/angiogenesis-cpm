library( ggplot2 )
library( dplyr )
#library( boot )
#library( simpleboot )
#library( patchwork )
library( bootES ) 

argv <- commandArgs( trailingOnly = TRUE )

inFile <- argv[1]
scanparm <- argv[2] # "chemstrength"
comparisons <- unlist( strsplit( argv[3], " " ))
outFile <- argv[4]

scan.lookup <- c( "chemstrength" = "lchem", "satstrength" = "saturation", "vegfdegr" = "epsilon", "cellcell" = "Jcc")
scancol <- scan.lookup[[scanparm]]


lookup.ylab <- c(
	"N" = "# regions",
	"Nwidth" = "nWidth",
	"networkLength" ="network length",
	"nBranches" = "# branches",
	"anisotropy" = "anisotropy"
)

lookup.xlab <- c( 
	"cellcell"= expression( J["cell-cell"] ), 
	"chemstrength" = expression(mu*" (chemotactic strength parameter)"),
	"satstrength" = "saturation coefficient",
	"vegfdegr" = expression(epsilon)
)


d <- read.csv( inFile )
if( scanparm == "cellcell" ){
	d <- d %>% filter( Jcc > 0 )
}
if( scanparm == "vegfdegr" ){
	d <- d %>% filter( epsilon > 0 )
}

d$value <- d[,scancol]
if( scanparm == "satstrength" ) d$value <- ifelse( d$framework == "MorpheusOrig", d$lchem, d$saturation)
d.scan <- split( d, d$value )




bootDF <- function( v1, v2, name1, name2, N ){
	
	#d.boot <- two.boot( v1, v2, "mean", R = N , na.rm = TRUE ) 
	#ci <- boot.ci( d.boot, type = "perc" )$percent[4:5]
	dboot <- rbind(
		data.frame( statistic = v1, platform = name1 ),
		data.frame( statistic = v2, platform = name2 )
	)
	dboot <- dboot[ !is.na( dboot$statistic), ]
	
	
	# check if all values are equal because bootstrapping will not work;
	if( diff( range( dboot$statistic ) ) == 0 ) {
		ci <- c( NA, NA )
		estimate <- 0
	} else {
		boot.out <- bootES( dboot, data.col = "statistic", group.col = "platform", 
			contrast = setNames( c(1,-1), c(name1,name2)), effect.type = "hedges.g", 
			R = N, ci.type="perc" ) 
		
		ci <- boot.out$bounds
		estimate <- boot.out$t0
	}

	#estimate <- mean( v1, na.rm = TRUE ) - mean (v2, na.rm = TRUE )
	return( data.frame(
		name = paste0(name1," - ",name2), 
		estimate = estimate,
		lo = ci[1],
		hi = ci[2],
		includesZero = ( 0 > ci[1] ) & ( 0 < ci[2] )
	))
}

getBoot <- function( dd, statName, N = 10000 ){
	dd$statistic <- dd[,statName ]
	
	vals <- lapply( comparisons, function(cc) {
		return( dd$statistic[ dd$framework == cc ] )
	})
	names(vals) <- comparisons

	comps <- t( combn( comparisons, 2 ) )
	out <- bind_rows( lapply( 1:nrow(comps), function(i) {
		simA <- comps[i,1]
		simB <- comps[i,2]
		vA <- vals[[simA]]
		vB <- vals[[simB]]
		return( bootDF( vA, vB, simA, simB, N ))
	})) %>%
		mutate( value = dd$value[1], stat = statName )
	return(out)

# 	vA <- dd$statistic[ dd$platform == "Artistoo" ]
# 	vC <- dd$statistic[ dd$platform == "CC3D" ]
# 	vM <- dd$statistic[ dd$platform == "Morpheus" ]
# 	
# 	AC <- bootDF( vA, vC, "Artistoo", "CC3D", N )
# 	AM <- bootDF( vA, vM, "Artistoo", "Morpheus", N )
# 	CM <- bootDF( vC, vM, "CC3D", "Morpheus", N )
# 	
# 	out <- rbind( AC, AM, CM ) %>%
# 		mutate( value = dd$value[1], stat = statName )
# 	return(out)
	
}

plotBoot <- function( dsc, statName ){
	plot.data <-  bind_rows( lapply( dsc, getBoot, statName ) )
	p <- ggplot( plot.data, aes( x = value, y = estimate ) ) + 
		geom_hline( yintercept = 0, lty = 2 ) +
		geom_ribbon( aes( ymin = lo, ymax = hi ), alpha = .2, color = NA ) + 
		geom_line() + 
		geom_point( data = plot.data[ !plot.data$includesZero,], color = "red" ) +
		labs( x = lookup.xlab[[scanparm]], title = lookup.ylab[[statName]],
			y = "cohen's d") +
		facet_wrap(~name, nrow = 1 ) +
		theme_bw() +
		theme(
			panel.grid = element_blank(),
			text = element_text(size=8),
			strip.background = element_blank()
		)
	return(p)
}

all.stats <- c( "N", "Nwidth", "networkLength", "nBranches", "anisotropy" )

all.boot <- bind_rows( lapply( all.stats, function(x){
	message(x)
	out <- bind_rows( lapply( d.scan, getBoot, x ) )
	return(out)
}) )


ax.breaks <- seq(-5,5)
ax.labels <- ifelse( ax.breaks %in% c(-5, -1, 0 , 1, 5 ), ax.breaks, "" )

p <- ggplot( all.boot, aes( x = value, y = estimate ) ) + 
		geom_hline( yintercept = 0, linewidth = .3 ) +
		geom_hline( yintercept = 1, linewidth = .3, lty = 2 ) +
		geom_hline( yintercept = -1, linewidth = .3, lty = 2 ) +
		geom_ribbon( aes( ymin = lo, ymax = hi ), alpha = .2, color = NA ) + 
		geom_line() + 
		geom_point( data = all.boot[ all.boot$includesZero %in% c( FALSE, NA),], color = "red3" ) +
		labs( x = lookup.xlab[[scanparm]], y = "hedges g") +
		scale_y_continuous( breaks=ax.breaks, labels = ax.labels, expand=c(0,0))+
		scale_x_continuous( expand=c(0,0))+
		facet_grid(stat~name) +
		theme_bw() +
		theme(
			panel.grid = element_blank(),
			text = element_text(size=8),
			strip.background = element_blank()
		)

# plot.list <- lapply( all.stats, function(x) {
# 	message(x)
# 	p <- plotBoot( d.scan, x )
# 	return(p)
# })
# 
# out <- wrap_plots( plot.list , ncol =1 ) + plot_layout( axes = "collect" )	
# 	
ggsave( outFile, plot = p, width = 12, height = 17, units = "cm" )