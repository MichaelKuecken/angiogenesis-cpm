library( ggplot2 )
library( dplyr )
library( boot )
library( simpleboot )
library( patchwork )

argv <- commandArgs( trailingOnly = TRUE )

inFile <- argv[1]
scanparm <- argv[2] # "chemstrength"
outFile <- argv[3]

scan.lookup <- c( "chemstrength" = "lchem", "satstrength" = "saturation", "vegfdegr" = "epsilon", "cellcell" = "Jcc")
scancol <- scan.lookup[[scanparm]]


lookup.ylab <- c(
	"N" = "difference in mean\n(# regions)",
	"Nwidth" = "difference in mean\n(Nwidth)",
	"networkLength" = "difference in mean\n(network length)",
	"nBranches" = "difference in mean\n(# branches)",
	"anisotropy" = "difference in mean\n(anisotropy)"
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
d.scan <- split( d, d$value )




bootDF <- function( v1, v2, name1, name2, N ){
	d.boot <- two.boot( v1, v2, "mean", R = N , na.rm = TRUE ) 
	ci <- boot.ci( d.boot, type = "perc" )$percent[4:5]
	estimate <- mean( v1, na.rm = TRUE ) - mean (v2, na.rm = TRUE )
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

	vA <- dd$statistic[ dd$platform == "Artistoo" ]
	vC <- dd$statistic[ dd$platform == "CC3D" ]
	vM <- dd$statistic[ dd$platform == "Morpheus" ]
	
	AC <- bootDF( vA, vC, "Artistoo", "CC3D", N )
	AM <- bootDF( vA, vM, "Artistoo", "Morpheus", N )
	CM <- bootDF( vC, vM, "CC3D", "Morpheus", N )
	
	out <- rbind( AC, AM, CM ) %>%
		mutate( value = dd$value[1], stat = statName )
	return(out)
	
}

plotBoot <- function( dsc, statName ){
	plot.data <-  bind_rows( lapply( dsc, getBoot, statName ) )
	p <- ggplot( plot.data, aes( x = value, y = estimate ) ) + 
		geom_hline( yintercept = 0, lty = 2 ) +
		geom_ribbon( aes( ymin = lo, ymax = hi ), alpha = .2, color = NA ) + 
		geom_line() + 
		geom_point( data = plot.data[ !plot.data$includesZero,], color = "red" ) +
		labs( x = lookup.xlab[[scanparm]], y = lookup.ylab[[statName]]) +
		facet_wrap(~name ) +
		theme_bw() +
		theme(
			panel.grid = element_blank(),
			text = element_text(size=8),
			strip.background = element_blank()
		)
	return(p)
}

all.stats <- c( "N", "Nwidth", "networkLength", "nBranches", "anisotropy" )

plot.list <- lapply( all.stats, function(x) {
	message(x)
	p <- plotBoot( d.scan, x )
	return(p)
})

out <- wrap_plots( plot.list , ncol =1 ) + plot_layout( axes = "collect" )	
	
ggsave( outFile, plot = out, width = 12, height = 17, units = "cm" )