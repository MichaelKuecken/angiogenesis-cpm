library( dplyr, warn.conflicts = FALSE ) 
library( ggplot2 ) 
library( patchwork ) 

argv <- commandArgs( trailingOnly = TRUE ) 

colormap <- c( "Artistoo" = "#84b8e0", "Morpheus" = "#360568", "CC3D" = "#E4C1F9" )

inFile <- argv[1]
scanparm <- argv[2]
outFile <- argv[3]

dd <- read.csv( inFile ) %>%
	mutate( framework = platform ) 

if( scanparm == "cellcell" ){
	
	dd <- dd %>% filter( Jcc > 0 ) %>% mutate( value = Jcc )
	annotations <- c(1, seq(4, 16, by = 4 ))
	jit <- 0.25
	xlab <- expression( J["cell-cell"] )
	lp <- c(0,0)
	
} else if (scanparm == "chemstrength" ) {

	dd$value <- dd$lchem
	annotations <- seq( 0, 600, by = 150 )
	jit <- 10
	xlab <- expression(mu*" (chemotactic strength parameter)")
	lp <- c(1,1)

} else if ( scanparm == "satstrength" ) {

	dd$value <- dd$saturation
	annotations <- seq( 0, .6, by = .15 )
	jit <- 0.01
	xlab <- "saturation coefficient"
	lp <- c(1,0)

} else if (scanparm == "vegfdegr" ){

	dd$value <- dd$epsilon
	annotations <- c( 0.05, seq( 0.15, .6, by = .15 ) )
	jit <- 0.01
	xlab <- expression(epsilon)
	lp <- c(1,1)

} else {
	stop( "choose scanvar = cellcell, chemstrength, satstrength, or vegfdegr.")
}

dsum <- dd %>%
	group_by( framework, value ) %>%
	summarise( 
		N = mean(N),
		Nwidth = mean(Nwidth),
		networkLength = mean(networkLength ),
		nBranches = mean( nBranches ),
		anisotropy = mean( anisotropy )
	)
 

ann <- data.frame( value2 = annotations )

plotMetric <- function( dd, scanparm , metric, show.legend = FALSE ){

	dd$y <- dd[,metric]
	
	dsumi <- dd %>%
		group_by( framework, value ) %>%
		summarise( 
			y = mean(y,na.rm = TRUE)
		)

	p <- ggplot( dd, aes( x = value + jit*( as.numeric( as.factor( framework ) ) -2 ), y = y, color = framework ) ) +
		geom_line( data= dsumi, alpha = .5, show.legend = show.legend ) +
		geom_jitter( height = 0, width = jit/2, size = .5 , show.legend = show.legend ) +
		geom_vline( data = ann, aes( xintercept= value2 ), linewidth = 0.2, color = "gray", lty =2 )+
		labs( x = xlab ,  y = metric, color = NULL ) +
		scale_color_manual( values = colormap ) +
		scale_x_continuous( breaks = unique(c(0, annotations) )  ) +
		theme_bw() +
		theme(
			panel.grid = element_blank(),
			legend.position = lp,
			legend.justification = lp,
			legend.background = element_blank(),
			legend.key.height = unit(0.3, "cm")
		)
	
	return(p)
}

p1 <- plotMetric( dd, scanparm, "Nwidth", show.legend = TRUE )
p2 <- plotMetric( dd, scanparm, "networkLength" )
p3 <- plotMetric( dd, scanparm, "nBranches" )
p4 <- plotMetric( dd, scanparm, "anisotropy" )

out <- p1 + p2 + p3 + p4 + plot_layout( ncol =1, axes = "collect" )

ggsave( outFile, width = 9, height = 13, units = "cm", useDingbats = FALSE )